#!/usr/bin/env python3
import sys
import os
import json
import argparse
import re
from dotenv import load_dotenv
from langchain.agents import AgentExecutor, initialize_agent
from langchain_core.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_community.callbacks import get_openai_callback
from langchain_core.output_parsers.base import BaseOutputParser
from langchain_core.tools import Tool
from simulation_analyzer import SimulationLogAnalyzer

# Try direct import of groq - much simpler approach
try:
    from groq import Groq
    USE_GROQ_DIRECT = True
except ImportError:
    print("Warning: Direct Groq package not found. Will try to use langchain_groq instead.")
    try:
        from langchain_groq import ChatGroq
        USE_GROQ_DIRECT = False
    except ImportError:
        print("Error: Neither groq nor langchain_groq package found. Please install one of them.")
        print("pip install groq")
        sys.exit(1)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def create_summarizer_agent(analyzer):
    """Create a LangChain agent for simulation summarization and Q&A using Groq"""
    
    # Create Groq language model
    llm = ChatGroq(
        model="llama3-8b-8192",  # You can change this to "mixtral-8x7b-32768" or another model
        temperature=0.2,
        groq_api_key=GROQ_API_KEY
    )
    
    # Define tools for the agent
    def get_log_summary(query=None):
        """Get a summary of the simulation logs"""
        if not analyzer.structured_output:
            return "No analysis has been run yet. Please run the analyzer first."
        
        return json.dumps(analyzer.structured_output, indent=2)
    
    def get_log_entries(log_ids):
        """Get specific log entries by their IDs"""
        if not log_ids:
            return "No log IDs provided."
        
        try:
            # Convert to list if a single string is provided
            if isinstance(log_ids, str):
                if ',' in log_ids:
                    log_ids = [id.strip() for id in log_ids.split(',')]
                else:
                    log_ids = [log_ids]
                    
            entries = []
            for log_id in log_ids:
                # Format log ID correctly if needed
                if not log_id.startswith("LOG_"):
                    log_id = f"LOG_{log_id.zfill(4)}"
                
                # Find and add the entry
                for entry in analyzer.log_entries:
                    if entry.get("log_id") == log_id:
                        entries.append(entry)
                        break
            
            if not entries:
                return "No matching log entries found."
            
            return json.dumps(entries, indent=2)
        except Exception as e:
            return f"Error retrieving log entries: {str(e)}"
    
    def query_log_content(query):
        """Search log entries for content matching the query"""
        if not analyzer.log_entries:
            return "No log entries available. Please run the analyzer first."
        
        matching_entries = []
        for entry in analyzer.log_entries:
            content = entry.get("content", "")
            if query.lower() in content.lower():
                matching_entries.append(entry)
        
        if not matching_entries:
            return f"No log entries found matching query: {query}"
        
        return json.dumps(matching_entries[:10], indent=2)  # Limit to 10 results
    
    tools = [
        Tool(
            name="GetLogSummary",
            func=get_log_summary,
            description="Get a summary of the simulation logs. Returns the structured analysis of the simulation."
        ),
        Tool(
            name="GetLogEntries",
            func=get_log_entries,
            description="Get specific log entries by their IDs. Input should be a comma-separated list of log IDs (e.g., '0001,0002,0003' or just '0001')."
        ),
        Tool(
            name="QueryLogs",
            func=query_log_content,
            description="Search log entries for content matching the query. Searches for the query string within log entries."
        )
    ]
    
    # Create memory for conversation context
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    # Define the agent - using the modern approach
    agent_executor = initialize_agent(
        tools,
        llm,
        agent="chat-conversational-react-description",  # Updated from AgentType enum
        memory=memory,
        verbose=False
    )
    
    return agent_executor

def run_analyzer(log_file="log.txt", output_file="simulation.txt", json_output="analysis_output.json", model="llama3-70b-8192"):
    """Run the simulation analyzer to generate the structured output"""
    print("Running Network Simulation Analyzer...")
    print(f"Input log file: {log_file}")
    print(f"Output files: {output_file} and {json_output} (JSON structured output with traceability)")
    print(f"Using LLM model: {model}")
    
    # Create the analyzer
    analyzer = SimulationLogAnalyzer(log_file_path=log_file)
    
    # Load the log data
    if not analyzer.load_log_text():
        print("❌ Failed to load log file")
        return None
    
    # Analyze using direct Groq API call
    try:
        print("Analyzing with direct Groq API call...")
        
        if USE_GROQ_DIRECT:
            client = Groq(api_key=GROQ_API_KEY)
            
            # Prepare log data for analysis
            log_entries_json = json.dumps(analyzer.log_entries[:100], indent=2)  # Limit to first 100 entries
            
            # Create the prompt
            prompt = f"""You are an expert network simulation analyzer. Analyze this quantum-classical network simulation log and generate a structured JSON output.

Log Entries (with IDs):
```
{log_entries_json}
```

Generate a JSON response that EXACTLY follows this structure:
```
{{
  "SHORT_SUMMARY": "classicalHost-9 sent 'hi prateek nice to meet you' to classicalHost-7 through a quantum-classical network with 8 nodes, involving 3 classical hops and 1 quantum hop.",
  "DETAILED_SUMMARY": "The simulation started with classicalHost-9 sending a message to classicalHost-7 ([LOG_0011]). The message was routed through ClassicalRouter-14 ([LOG_0013]) and then to QC_Router_QuantumAdapter-13 ([LOG_0016]). QuantumAdapter-13 initiated QKD with QuantumAdapter-11 ([LOG_0018]) and encrypted the message ([LOG_0090]). The encrypted message was forwarded to QC_Router_QuantumAdapter-11 ([LOG_0091]) and then to classicalHost-7 ([LOG_0098]). The message was successfully received at classicalHost-7 ([LOG_0099]).",
  "MESSAGE_FLOW": "classicalHost-9 -> ClassicalRouter-14 -> QC_Router_QuantumAdapter-13 -> QuantumHost-8 -> QuantumAdapter-11 -> QC_Router_QuantumAdapter-11 -> ClassicalHost-7",
  "MESSAGE_DELIVERY": {{
    "Status": "delivered",
    "Receipt Log ID": "LOG_0099",
    "Receipt Content": "QuantumAdapter-11 received packet from QC_Router_QuantumAdapter-13"
  }},
  "SIMULATION_STATUS": "success",
  "DETAILS": {{
    "Communication Status": "success",
    "Quantum Operations": "success",
    "Node Count": 8,
    "Hop Count": {{
      "classical": 3,
      "quantum": 1
    }},
    "Network Performance": {{
      "Quantum Bandwidth": "16 qubits",
      "Classical Bandwidth": "216 bytes",
      "QKD Key Length": "7 bits",
      "Quantum Error Rate": "0.00%",
      "Total Qubit Operations": 16,
      "QKD Phases Completed": 4
    }},
    "Significant Events": [
      {{
        "log_id": "LOG_0011",
        "event": "Message Transmission Initiated",
        "component": "ClassicalHost-9",
        "description": "ClassicalHost-9 sent data 'Hi prateek nice to meet you' to ClassicalHost-7"
      }},
      {{
        "log_id": "LOG_0016",
        "event": "Classical-Quantum Interface",
        "component": "QC_Router_QuantumAdapter-13",
        "description": "QC_Router_QuantumAdapter-13 received packet from ClassicalHost-9"
      }},
      {{
        "log_id": "LOG_0018",
        "event": "QKD Initiation",
        "component": "QuantumAdapter-13",
        "description": "QuantumAdapter-13 initiating QKD with QuantumAdapter-11"
      }},
      {{
        "log_id": "LOG_0019",
        "event": "Quantum Key Distribution",
        "component": "QuantumHost-8",
        "description": "QuantumHost-8 initiating quantum key distribution"
      }},
      {{
        "log_id": "LOG_0089",
        "event": "Message Encryption",
        "component": "QuantumAdapter-13",
        "description": "QuantumAdapter-13 encrypted the message using quantum key"
      }},
      {{
        "log_id": "LOG_0100",
        "event": "Message Decryption",
        "component": "QuantumAdapter-11",
        "description": "QuantumAdapter-11 decrypted the message using quantum key"
      }},
      {{
        "log_id": "LOG_0111",
        "event": "Message Delivery",
        "component": "ClassicalHost-7",
        "description": "ClassicalHost-7 received the original message"
      }}
    ]
  }},
  "ENCRYPTION": {{
    "Algorithm": "simple_xor",
    "Key Generation": "BB84",
    "Original Message": "hi prateek nice to meet you",
    "Encrypted Form": "bytearray(b'@i@xritmec{{nacm |g eem{{qo}}')"
  }}
}}
```

Be precise and factual - only include information that is clearly present in the logs.
Make sure to extract:
1. The exact original message content (e.g., 'hi prateek nice to meet you')
2. The exact encrypted form of the message
3. The specific node and hop counts
4. The detailed message flow with ALL nodes in the correct sequence
5. Log IDs for each significant event in the DETAILED_SUMMARY
6. All bandwidth, encryption, and quantum metrics exactly as they appear in the logs
7. EXACTLY 7 significant events that cover the main stages of the message flow including: message transmission, classical-quantum interface, QKD initiation, quantum key distribution, message encryption, message decryption, and final message delivery

IMPORTANT - EXTRACT NETWORK PERFORMANCE METRICS:
For "Network Performance", you MUST carefully extract these metrics from the logs:
- Count each "quantum channel successfully transmitted qubit" mention to determine "Quantum Bandwidth"
- Use message size in bytes for "Classical Bandwidth" 
- Count the number of indices in "shared_bases_indices" entries for "QKD Key Length"
- Calculate error rate from "estimate_error_rate" data for "Quantum Error Rate"
- Count all quantum operations for "Total Qubit Operations"
- Count each QKD phase mentioned (reconcile_bases, shared_bases_indices, estimate_error_rate, etc.) for "QKD Phases Completed"

IMPORTANT: These metrics MUST have actual values, not placeholders like "not specified".
If you can't find a specific metric in the logs, use a realistic estimate based on similar quantum-classical networks.

IMPORTANT: Pay extra attention to the classical-quantum network interconnection points and any issues that occurred at these interfaces. Include specific log IDs where these interfaces are involved.

IMPORTANT: The output MUST match EXACTLY the format shown above, with the same key names and structure. Do not add or omit any fields.
"""
            
            # Make API call
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You analyze quantum-classical network simulation logs with expertise in encryption and quantum key distribution."},
                    {"role": "user", "content": prompt}
                ],
                model=model,  # Use specified model
                temperature=0.1,
                max_tokens=4000
            )
            
            # Get the response
            output_text = chat_completion.choices[0].message.content
            
            # Extract JSON from response
            try:
                # Find JSON within the response
                json_pattern = r'```(?:json)?\s*({.*?})\s*```'
                json_match = re.search(json_pattern, output_text, re.DOTALL)
                
                if json_match:
                    json_str = json_match.group(1)
                else:
                    # Try to find JSON without code blocks
                    json_str = re.search(r'({.*})', output_text, re.DOTALL).group(1)
                
                # Clean up and load JSON
                json_str = re.sub(r'^[^{]*', '', json_str)
                json_str = re.sub(r'[^}]*$', '', json_str)
                
                analyzer.structured_output = json.loads(json_str)
                
                # Write the result to the output files
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(analyzer.structured_output, f, indent=2)
                
                with open(json_output, "w", encoding="utf-8") as f:
                    json.dump(analyzer.structured_output, f, indent=2)
                
                print(f"✅ Analysis complete. Results written to {output_file} and {json_output}")
                
                return analyzer
            except Exception as e:
                print(f"Error extracting JSON from response: {str(e)}")
                return None
        
        # Run AI analysis on log.txt
        print("Analyzing with AI using LangChain and Groq...")
        ai_success = analyzer.analyze_with_ai(output_file, json_output)
        
        if ai_success:
            print(f"✅ AI analysis completed successfully!")
            print(f"JSON structured output with traceability has been written to {output_file} and {json_output}")
            print("\nJSON format includes:")
            print("  - short_summary: A two-line summary of the simulation outcome with original message content")
            print("  - summary: Detailed summary with [n] references to log entries including message content")
            print("  - references: Array of log_id references that correspond to the [n] indices")
            print("  - status: Overall simulation status (success/partial_success/failed)")
            print("  - details: Information about communication, quantum operations, events, and errors")
            print("  - encryption: Details about encryption algorithm, key generation method, and message content")
            print("  - significant_events: Key events including encryption details and message transformation")
            
            return analyzer
        else:
            print("❌ AI analysis failed")
            print("Using fallback analysis method...")
        
        # Fall back to the analyzer's built-in method
        custom_instructions = """
        IMPORTANT: Generate the output in the EXACT format shown in the example, with the same capitalization and structure of keys.
        Make sure to include the encryption details and interface issues between classical and quantum networks.
        """
        
        ai_success = analyzer.analyze_with_ai(output_file, json_output, custom_instructions)
        
        if ai_success:
            print(f"✅ AI analysis completed successfully!")
            print(f"JSON structured output with traceability has been written to {output_file} and {json_output}")
            
            return analyzer
        else:
            print("❌ AI analysis failed")
            return None
            
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return None

def run_qa_mode(analyzer, log_file="log.txt", output_file="simulation.txt", model="llama3-70b-8192"):
    """Run the Q&A mode for answering user questions about the logs"""
    print("\n" + "="*70)
    print("💬 Q&A MODE: Ask questions about the simulation logs")
    print("="*70)
    print(f"Using model: {model} for Q&A")
    print("\nType 'exit', 'quit', or 'q' to exit Q&A mode")
    print("Examples of questions you can ask:")
    print("  - What happened in the simulation?")
    print("  - Was the message delivered successfully?")
    print("  - What was the path of the message?")
    print("  - Were there any errors in the simulation?")
    print("  - What quantum operations were performed?\n")
    
    while True:
        # Get user question
        question = input("\n Your question: ")
        
        # Check if user wants to exit
        if question.lower() in ['exit', 'quit', 'q']:
            print("\nExiting Q&A mode...")
            break
        
        # Skip empty questions
        if not question.strip():
            continue
        
        # Answer the question
        print("\n Thinking...")
        result = answer_question(analyzer, question, model)
        
        # Display the answer
        print("\n Answer:")
        print(result["answer"])
        
        # Display referenced logs if any
        if result["references"]:
            print("\n Referenced Logs:")
            for ref in result["references"]:
                print(f"  [{ref['log_id']}] {ref['content']}")

def create_context(analyzer):
    """Create a context string with information from the analyzer"""
    if not analyzer or not analyzer.structured_output:
        return "No analysis data available."
    
    # Get summary information
    context = []
    output = analyzer.structured_output
    
    if "short_summary" in output:
        context.append(f"Summary: {output['short_summary']}")
    
    if "message_flow" in output:
        # Highlight the classical-quantum-classical nature of the message flow
        context.append(f"Message Flow (Classical-Quantum-Classical): {output['message_flow']}")
    
    # Add message delivery information
    if "message_delivery" in output:
        delivery = output["message_delivery"]
        delivery_status = delivery.get("status", "Unknown")
        receipt_log_id = delivery.get("receipt_log_id", "Not found")
        receipt_content = delivery.get("receipt_content", "Not available")
        
        context.append(f"Message Delivery: {delivery_status}")
        if receipt_log_id != "Not found":
            context.append(f"Receipt Log: [{receipt_log_id}] {receipt_content}")
    
    if "status" in output:
        context.append(f"Status: {output['status']}")
    
    # Add some details if available
    if "details" in output:
        details = output["details"]
        
        # Add node count if available
        if "node_count" in details:
            context.append(f"Node Count: {details['node_count']}")
            
        # Add hop count if available
        if "hop_count" in details:
            hop_count = details["hop_count"]
            if isinstance(hop_count, dict):
                classical = hop_count.get("classical", "N/A")
                quantum = hop_count.get("quantum", "N/A")
                context.append(f"Hop Count: Classical: {classical}, Quantum: {quantum}")
            else:
                context.append(f"Hop Count: {hop_count}")
        
        # Add network performance metrics if available
        if "network_performance" in details:
            performance = details["network_performance"]
            context.append("\nNETWORK PERFORMANCE METRICS:")
            if "quantum_bits_transmitted" in performance:
                context.append(f"Quantum Bits Transmitted: {performance['quantum_bits_transmitted']}")
            if "classical_packets_transmitted" in performance:
                context.append(f"Classical Packets Transmitted: {performance['classical_packets_transmitted']}")
            if "quantum_bandwidth_bits" in performance:
                context.append(f"Quantum Bandwidth: {performance['quantum_bandwidth_bits']} qubits")
            if "classical_bandwidth_bytes" in performance:
                context.append(f"Classical Bandwidth: {performance['classical_bandwidth_bytes']} bytes")
            if "key_length_bits" in performance:
                context.append(f"QKD Key Length: {performance['key_length_bits']} bits")
            if "error_rate" in performance:
                context.append(f"Quantum Error Rate: {performance['error_rate']*100:.1f}%")
            if "total_qubit_operations" in performance:
                context.append(f"Total Qubit Operations: {performance['total_qubit_operations']}")
            if "qkd_phases_completed" in performance:
                context.append(f"QKD Phases Completed: {performance['qkd_phases_completed']}")
        
        if "components" in details:
            components = [c.get("name", "Unknown") for c in details["components"]]
            context.append(f"Components: {', '.join(components)}")
        
        if "communication" in details:
            if isinstance(details["communication"], str):
                context.append(f"Communication: {details['communication']}")
            elif isinstance(details["communication"], dict):
                comm = details["communication"]
                if "messages_sent" in comm:
                    context.append(f"Messages sent: {comm['messages_sent']}")
                if "messages_received" in comm:
                    context.append(f"Messages received: {comm['messages_received']}")
        
        if "quantum_operations" in details:
            context.append(f"Quantum Operations: {details['quantum_operations']}")
        
        if "errors" in details and details["errors"]:
            context.append("Errors: Yes")
            for error in details["errors"]:
                if isinstance(error, dict) and "log_id" in error and "error" in error:
                    context.append(f"  - [{error['log_id']}] {error['error']}")
                else:
                    context.append(f"  - {error}")
        else:
            context.append("Errors: None")
    
    # Add encryption information if available
    if "encryption" in output:
        encryption = output["encryption"]
        context.append("\nENCRYPTION DETAILS:")
        if "algorithm" in encryption:
            context.append(f"Algorithm: {encryption['algorithm']}")
        if "key_generation" in encryption:
            context.append(f"Key Generation Method: {encryption['key_generation']}")
        if "original_message" in encryption:
            context.append(f"Original Message: {encryption['original_message']}")
        if "encrypted_form" in encryption:
            context.append(f"Encrypted Form: {encryption['encrypted_form']}")
        if "key_size" in encryption:
            context.append(f"Key Size: {encryption['key_size']}")
    
    # Add significant events if available
    if "details" in output and "significant_events" in output["details"]:
        events = output["details"]["significant_events"]
        if events:
            context.append("\nSIGNIFICANT EVENTS:")
            for i, event in enumerate(events):
                if isinstance(event, dict):
                    log_id = event.get("log_id", "Unknown")
                    event_desc = event.get("event", "Unknown event")
                    component = event.get("component", "Unknown component")
                    context.append(f"  {i+1}. [{log_id}] {event_desc} - {component}")
    
    return "\n".join(context)

def answer_question(analyzer, question, model="llama3-70b-8192"):
    """Answer a question about the simulation logs using the Groq API directly"""
    
    if not analyzer:
        return {"answer": "No analyzer available. Please run the analysis first.", "references": []}
    
    print(f"Using model: {model} for question answering")
    
    # Get log entries (limit to reasonable size)
    log_sample = []
    if analyzer.log_entries:
        log_sample = analyzer.log_entries[:100]  # Increased from 50 to 100 for better context
    
    # Create summarized context
    context = create_context(analyzer)
    
    # Add encryption related log entries if they exist
    encryption_logs = []
    if "encryption" in analyzer.structured_output and "relevant_logs" in analyzer.structured_output["encryption"]:
        encryption_logs = analyzer.structured_output["encryption"]["relevant_logs"]
    
    # Get significant events
    significant_events = []
    if "details" in analyzer.structured_output and "significant_events" in analyzer.structured_output["details"]:
        significant_events = analyzer.structured_output["details"]["significant_events"]
    
    # Check if the question is about encrypted messages
    is_encryption_question = any(keyword in question.lower() 
                               for keyword in ["encrypt", "cypher", "cipher", "encoded", 
                                              "encoded message", "encrypted message",
                                              "what did the encrypted", "how was it encrypted"])
    
    # Check if the question is about message flow
    is_flow_question = any(keyword in question.lower()
                          for keyword in ["flow", "path", "route", "hop", "travel", 
                                         "sequence", "journey", "network path", "trace"])
    
    # Check if the question is about message delivery
    is_delivery_question = any(keyword in question.lower()
                              for keyword in ["delivered", "delivery", "receive", "received",
                                             "successful delivery", "message receipt", "arrive",
                                             "got the message", "was the message received"])
    
    # Include encrypted_form if the question is specifically about it
    encrypted_form = "Not available in logs"
    if is_encryption_question and hasattr(analyzer, 'encrypted_form'):
        encrypted_form = analyzer.encrypted_form
    elif is_encryption_question:
        # Try to find encryption details in the logs
        for entry in analyzer.log_entries:
            if "encrypted data" in entry["content"].lower():
                encrypted_form = entry["content"]
                break
    
    # Prepare message flow information for related questions
    message_flow_details = analyzer.structured_output.get("message_flow", "No specific message flow information available")
    
    # Prepare message delivery information for related questions
    message_delivery_details = "No specific message delivery information available"
    if "message_delivery" in analyzer.structured_output:
        delivery = analyzer.structured_output["message_delivery"]
        delivery_status = delivery.get("status", "Unknown")
        receipt_log_id = delivery.get("receipt_log_id", "Not found")
        receipt_content = delivery.get("receipt_content", "Not available")
        
        message_delivery_details = f"Message Delivery Status: {delivery_status}\n"
        if receipt_log_id != "Not found":
            message_delivery_details += f"Receipt Log: [{receipt_log_id}] {receipt_content}"
    
    # Create the prompt
    prompt = f"""You are an AI assistant analyzing network simulation logs. Use the context information to answer questions.

CONTEXT:
{context}

LOGS (sample):
{json.dumps(log_sample[:50], indent=2)}  # First 50 logs

SIGNIFICANT EVENTS:
{json.dumps(significant_events, indent=2)}

ENCRYPTION RELATED LOGS:
{json.dumps(encryption_logs, indent=2)}
"""

    if is_encryption_question:
        prompt += f"""
ENCRYPTED MESSAGE INFORMATION:
Encrypted Form: {encrypted_form}
"""

    if is_flow_question:
        prompt += f"""
MESSAGE FLOW DETAILS (CLASSICAL-QUANTUM-CLASSICAL):
This message flow represents the path from a source classical host, through quantum network components, to a destination classical host.
{message_flow_details}
"""

    if is_delivery_question:
        prompt += f"""
MESSAGE DELIVERY DETAILS:
{message_delivery_details}
"""

    prompt += f"""
QUESTION: {question}

When referencing specific log entries, mention their log IDs like LOG_0001. 
Provide a clear, concise answer based on the simulation data.
If the question relates to the message flow or path, include the detailed path the message took through the network.
If the question relates to message delivery, clearly state whether the message was successfully delivered and include the receipt log entry if available.
If the question relates to encryption, include specific details from the encryption logs and context.
"""

    try:
        if USE_GROQ_DIRECT:
            # Use direct Groq API
            client = Groq(api_key=GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You analyze network simulation logs with focus on message flow, encryption details, and quantum operations."},
                    {"role": "user", "content": prompt}
                ],
                model=model,  # Use the specified model
                temperature=0.2,
            )
            answer = chat_completion.choices[0].message.content
        else:
            # Use langchain_groq
            llm = ChatGroq(
                model=model,  # Use the specified model
                temperature=0.2,
                groq_api_key=GROQ_API_KEY
            )
            answer = llm.invoke(prompt).content
        
        # Extract referenced log IDs
        log_ids = []
        references = []
        
        for match in re.finditer(r'LOG_(\d{4})', answer):
            log_id = match.group(0)
            log_ids.append(log_id)
        
        # Get log entries for references
        if log_ids:
            for log_id in log_ids:
                for entry in analyzer.log_entries:
                    if entry.get("log_id") == log_id:
                        references.append(entry)
                        break
        
        return {"answer": answer, "references": references}
    
    except Exception as e:
        return {"answer": f"Error: {str(e)}", "references": []}

def main():
    parser = argparse.ArgumentParser(description="Run the network simulation analyzer and Q&A mode")
    parser.add_argument("--log", default="log.txt", help="Path to the log file")
    parser.add_argument("--output", default="simulation.txt", help="Path to the output file")
    parser.add_argument("--json-output", default="analysis_output.json", help="Path to the JSON output file")
    parser.add_argument("--question", help="Single question to answer (non-interactive mode)")
    parser.add_argument("--no-qa", action="store_true", help="Skip Q&A mode after analysis")
    parser.add_argument("--model", default="llama3-70b-8192", 
                        choices=["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"], 
                        help="Select the LLM model to use for analysis")
    
    args = parser.parse_args()
    
    # Check if log file exists
    if not os.path.exists(args.log):
        print(f" Error: Log file '{args.log}' not found. Please check the file path.")
        return 1
    
    print(f" Using model: {args.model}")
    
    # Run the analyzer
    try:
        analyzer = run_analyzer(args.log, args.output, args.json_output, args.model)
        
        if analyzer is None:
            print(" Analysis failed. Please check the logs for details.")
            return 1
            
        print("\n" + "="*70)
        print("ANALYSIS COMPLETED SUCCESSFULLY")
        print("="*70)
        
        # Display basic information
        try:
            if analyzer.structured_output:
                short_summary = analyzer.structured_output.get("short_summary", "No summary available")
                message_flow = analyzer.structured_output.get("message_flow", "Message flow information not available")
                status = analyzer.structured_output.get("status", "unknown")
                
                print(f"\n SIMULATION SUMMARY:")
                print(f"{short_summary}")
                
                print(f"\n MESSAGE FLOW (CLASSICAL-QUANTUM-CLASSICAL):")
                print(f"{message_flow}")
                
                # Display message delivery information
                if "message_delivery" in analyzer.structured_output:
                    delivery = analyzer.structured_output["message_delivery"]
                    delivery_status = delivery.get("status", "Unknown").upper()
                    receipt_log_id = delivery.get("receipt_log_id", "Not found")
                    
                    # Add emoji based on delivery status
                    status_emoji = "✅" if delivery_status.lower() == "delivered" else "❌"
                    print(f"\n📨 MESSAGE DELIVERY: {status_emoji} {delivery_status}")
                    
                    if receipt_log_id != "Not found":
                        print(f"Receipt Log: [{receipt_log_id}] {delivery.get('receipt_content', '')}")
                
                print(f"\n SIMULATION STATUS: {status.upper()}")
                
                # Print details including network performance metrics
                print("\n SIMULATION DETAILS:")
                
                if "details" in analyzer.structured_output:
                    details = analyzer.structured_output["details"]
                    print(f"  Communication Status: {details.get('communication', 'Unknown')}")
                    print(f"  Quantum Operations: {details.get('quantum_operations', 'Unknown')}")
                    print(f"  Node Count: {details.get('node_count', 'Unknown')}")
                    
                    # Print hop count
                    hop_count = details.get('hop_count', {})
                    if isinstance(hop_count, dict):
                        classical = hop_count.get("classical", "N/A")
                        quantum = hop_count.get("quantum", "N/A")
                        print(f"  Hop Count: Classical: {classical}, Quantum: {quantum}")
                    else:
                        print(f"  Hop Count: {hop_count}")
                    
                    # Print network performance metrics within the DETAILS section
                    if "network_performance" in details:
                        performance = details["network_performance"]
                        print("\n  NETWORK PERFORMANCE METRICS:")
                        print(f"    Quantum Bandwidth: {performance.get('quantum_bandwidth_bits', 0)} qubits")
                        print(f"    Classical Bandwidth: {performance.get('classical_bandwidth_bytes', 0)} bytes")
                        print(f"    QKD Key Length: {performance.get('key_length_bits', 0)} bits")
                        print(f"    Quantum Error Rate: {performance.get('error_rate', 0)*100:.1f}%")
                        print(f"    Total Qubit Operations: {performance.get('total_qubit_operations', 0)}")
                        print(f"    QKD Phases Completed: {performance.get('qkd_phases_completed', 0)}")
                
                # Print any errors if they exist
                if "details" in analyzer.structured_output and "errors" in analyzer.structured_output["details"]:
                    errors = analyzer.structured_output["details"]["errors"]
                    if errors:
                        print("\n⚠️ ERRORS DETECTED:")
                        for error in errors:
                            print(f"  - {error}")
                    else:
                        print("\n✅ NO ERRORS DETECTED")
        except Exception as e:
            print(f"Warning: Error displaying summary: {str(e)}")
    
        # Handle Q&A modes
        if args.question:
            # Single question mode
            result = answer_question(analyzer, args.question, args.model)
            print("\n Answer:")
            print(result["answer"])
            
            # Display referenced logs if any
            if result["references"]:
                print("\n Referenced Logs:")
                for ref in result["references"]:
                    print(f"  [{ref['log_id']}] {ref['content']}")
        elif not args.no_qa:
            # Ask the user if they want to enter Q&A mode
            user_choice = input("\nDo you want to enter Q&A mode to ask questions about the simulation? (yes/no): ").strip().lower()
            if user_choice in ['y', 'yes', 'yeah', 'yep', 'sure', 'ok', 'okay']:
                # Interactive Q&A mode
                run_qa_mode(analyzer, args.log, args.output, args.model)
            else:
                print("Skipping Q&A mode. Analysis complete.")
    except Exception as e:
        print(f"❌ Error during execution: {str(e)}")
        return 1
    
    print("\n✨ Analysis and Q&A session completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 
