#!/usr/bin/env python3
import sys
import os
import json
import argparse
from dotenv import load_dotenv
from langchain.agents import AgentExecutor, initialize_agent
from langchain_core.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_community.callbacks import get_openai_callback
from langchain_core.output_parsers.base import BaseOutputParser
from langchain_core.tools import Tool
from langchain_groq import ChatGroq
from simulation_analyzer import SimulationLogAnalyzer

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

def run_analyzer(log_file="log.txt", output_file="simulation.txt", json_output="analysis_output.json"):
    """Run the simulation analyzer to generate the structured output"""
    print("Running Network Simulation Analyzer...")
    print(f"Input log file: {log_file}")
    print(f"Output files: {output_file} and {json_output} (JSON structured output with traceability)")
    
    # Create and run the analyzer with just the log file
    analyzer = SimulationLogAnalyzer(log_file_path=log_file)
    
    # Run AI analysis on log.txt
    print("Analyzing with AI using LangChain and Groq...")
    ai_success = analyzer.analyze_with_ai(output_file, json_output)
    
    if ai_success:
        print(f"✅ AI analysis completed successfully!")
        print(f"JSON structured output with traceability has been written to {output_file} and {json_output}")
        print("\nJSON format includes:")
        print("  - short_summary: A very concise summary of the simulation outcome")
        print("  - summary: Detailed summary with [n] references to log entries")
        print("  - references: Array of log_id references that correspond to the [n] indices")
        print("  - status: Overall simulation status (success/partial_success/failed)")
        print("  - details: Information about communication, quantum operations, events, and errors")
        
        return analyzer
    else:
        print("❌ AI analysis failed")
        return None

def run_qa_mode(analyzer, log_file="log.txt", output_file="simulation.txt"):
    """Run the Q&A mode for answering user questions about the logs using a LangChain agent"""
    print("\n" + "="*70)
    print("💬 Q&A MODE: Ask questions about the simulation logs")
    print("="*70)
    print("\nType 'exit', 'quit', or 'q' to exit Q&A mode")
    print("Examples of questions you can ask:")
    print("  - What happened in the simulation?")
    print("  - Was the message delivered successfully?")
    print("  - What was the path of the message?")
    print("  - Were there any errors in the simulation?")
    print("  - What quantum operations were performed?\n")
    
    # Create the agent
    agent = create_summarizer_agent(analyzer)
    
    while True:
        # Get user question
        question = input("\n👤 Your question: ")
        
        # Check if user wants to exit
        if question.lower() in ['exit', 'quit', 'q']:
            print("\nExiting Q&A mode...")
            break
        
        # Skip empty questions
        if not question.strip():
            continue
        
        # Answer the question using the agent
        print("\n🤔 Thinking...")
        try:
            # Use invoke instead of run to avoid deprecation warning
            response = agent.invoke({"input": question})
            
            # Display the answer
            print("\n🤖 Answer:")
            print(response["output"])
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            print("Please try a different question or rephrase your question.")

def main():
    parser = argparse.ArgumentParser(description="Run the network simulation analyzer and Q&A mode")
    parser.add_argument("--log", default="log.txt", help="Path to the log file")
    parser.add_argument("--output", default="simulation.txt", help="Path to the output file")
    parser.add_argument("--json-output", default="analysis_output.json", help="Path to the JSON output file")
    parser.add_argument("--question", help="Single question to answer (non-interactive mode)")
    parser.add_argument("--no-qa", action="store_true", help="Skip Q&A mode after analysis")
    
    args = parser.parse_args()
    
    # Run the analyzer
    analyzer = run_analyzer(args.log, args.output, args.json_output)
    
    if analyzer is None:
        return 1
    
    # Handle Q&A modes
    if args.question:
        # Single question mode
        print(f"\n👤 Question: {args.question}")
        
        # Create and use the agent for a single question
        agent = create_summarizer_agent(analyzer)
        try:
            # Use invoke instead of run to avoid deprecation warning
            response = agent.invoke({"input": args.question})
            print("\n🤖 Answer:")
            print(response["output"])
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
    elif not args.no_qa:
        # Ask the user if they want to enter Q&A mode
        user_choice = input("\nDo you want to enter Q&A mode to ask questions about the simulation? (yes/no): ").strip().lower()
        if user_choice in ['y', 'yes', 'yeah', 'yep', 'sure', 'ok', 'okay']:
            # Interactive Q&A mode
            run_qa_mode(analyzer, args.log, args.output)
        else:
            print("Skipping Q&A mode. Analysis complete.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 