from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LogSummarizer:
    def __init__(self):
        # Initialize Groq LLM
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in your .env file.")
            
        self.llm = ChatGroq(
            temperature=0.7,
            model_name="llama3-8b-8192"
        )
        
        # Create analysis prompt template
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert network simulation analyst specializing in hybrid classical-quantum networks.
            Your task is to analyze network simulation logs and configuration data to provide detailed technical insights.
            
            CRITICAL INSTRUCTION:
            1. The network.json file contains the intended network configuration
            2. The log.txt file shows what ACTUALLY happened during simulation
            3. There are SIGNIFICANT DIFFERENCES between configuration and execution
            4. You MUST explicitly identify ALL entities in logs that are NOT in the configuration
            5. You MUST analyze the actual data flow through the network"""),
            
            ("user", """Please analyze the following network simulation data and provide a detailed technical analysis:
            
            Network Configuration (network.json):
            {network_config}
            
            Simulation Logs (log.txt):
            {simulation_logs}
            
            Follow these instructions EXACTLY:
            
            1. Configuration vs Execution Discrepancies:
               - List ALL entities in logs that are NOT defined in network.json (e.g., Charlie, Dave, Router_Zone1)
               - List ALL entities in network.json that do NOT appear in logs
               - Analyze why the simulation is executing differently than configured
               
            2. Actual Network Architecture (from logs):
               - List ALL classical components observed in logs 
               - List ALL quantum components observed in logs
               - Identify ALL adapters observed in logs
            
            3. Message Flow Analysis:
               - Trace the EXACT path of the 'HELLO WORLD' message from Alice to Dave
               - Identify WHICH adapters and routers handle the message
               - Explain HOW classical data is transferred through quantum network infrastructure
            
            4. Quantum Aspects:
               - Analyze the quantum communication events in detail
               - Identify the role of the qubits mentioned in logs
               - Describe how the quantum adapters enable classical-quantum communication
            
            5. Other Insights:
               - Component creation and initialization sequence
               - Potential issues, bottlenecks or anomalies
               - Security considerations""")
        ])
        
        # Create summary prompt template
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a technical writer with deep expertise in quantum computing and networking.
            Your task is to create clear, detailed technical summaries of network simulation analyses.
            
            CRITICAL INSTRUCTIONS:
            1. Your summary MUST acknowledge discrepancies between configuration and execution
            2. You MUST explicitly list entities that appear in logs but not in configuration
            3. You MUST accurately describe the actual message flow from Alice to Dave
            4. You MUST explain how classical data traverses the quantum infrastructure"""),
            ("user", """Based on the following analysis, create a detailed technical summary:
            
            Analysis:
            {analysis}
            
            Please include:
            1. Executive Overview:
               - Key findings and observations
               - Critical patterns identified
               - Overall system health assessment
            
            2. Detailed Findings:
               - Component-wise breakdown of behavior
               - Communication efficiency metrics
               - Security and performance insights
            
            3. Technical Recommendations:
               - Specific optimization opportunities
               - Security enhancement suggestions
               - Architecture improvement proposals
            
            4. Future Considerations:
               - Scalability assessment
               - Potential bottlenecks to address
               - Suggested monitoring points
            
            Format the summary in a clear, technical style suitable for network engineers.""")
        ])
    
    def load_simulation_data(self):
        """Load simulation data from network.json and log.txt"""
        try:
            # Load network configuration
            with open('network.json', 'r') as f:
                network_data = json.load(f)
            
            # Load simulation logs
            with open('log.txt', 'r') as f:
                log_data = f.read()
            
            return {
                "network_config": json.dumps(network_data, indent=2),
                "simulation_logs": log_data
            }
        except FileNotFoundError as e:
            print(f"Error: Could not find required file - {e.filename}")
            return None
        except json.JSONDecodeError:
            print("Error: network.json contains invalid JSON data")
            return None
        except Exception as e:
            print(f"Unexpected error loading simulation data: {e}")
            return None
    
    def analyze_simulation(self, simulation_data):
        """Analyze the simulation data using the Groq LLM"""
        try:
            # Create a detailed analysis prompt that forces specific outputs
            final_analysis_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert network simulation analyst specializing in hybrid classical-quantum networks.
                
                CRITICAL INSTRUCTION:
                You MUST base your analysis primarily on the log.txt file, as it shows what actually happened.
                Mention discrepancies with network.json but focus on the actual events in the logs.
                You MUST complete ALL sections of the analysis.
                
                You MUST format your response using EXACTLY the following structure:
                
                # Executive Overview
                
                ## Key Findings and Observations
                [List key findings from the log file]
                
                ## Discrepancies with Network Configuration
                [List main differences between log.txt and network.json]
                
                # Network Components Involved in Data Flow
                
                ## Classical Components
                [List classical components actually involved in data transfer according to logs]
                
                ## Quantum Components
                [List quantum components actually involved in data transfer according to logs]
                
                ## Adapters and Interfaces
                [List adapters that appear in the logs as handling data]
                
                # Actual Flow of Information
                [Detailed step-by-step sequence of the message flow as shown in logs]
                
                # Communication Efficiency Metrics
                [Analysis of communication patterns and efficiency from logs]
                
                # Security and Performance Insights
                [Security and performance observations based on log events]
                
                # Technical Recommendations
                [Recommendations based on log analysis]"""),
                ("user", """Analyze the following network simulation data and provide a structured analysis following EXACTLY the format specified, with primary focus on the log.txt events:
                
                Network Configuration (network.json):
                {network_config}
                
                Simulation Logs (log.txt):
                {simulation_logs}""")
            ])
            
            # Generate the complete analysis
            analysis_chain = final_analysis_prompt | self.llm | StrOutputParser()
            return analysis_chain.invoke(simulation_data)
        except Exception as e:
            print(f"Error during analysis: {e}")
            return None

def main():
    try:
        summarizer = LogSummarizer()
        simulation_data = summarizer.load_simulation_data()
        
        if simulation_data:
            result = summarizer.analyze_simulation(simulation_data)
            if result:
                print("\nSimulation Analysis Summary:")
                print(result)
                
                # Save the summary to the new file
                with open('latest_network_analysis.txt', 'w') as f:
                    f.write(result)
                print("\nDetailed summary has been saved to 'latest_network_analysis.txt'")
            else:
                print("Analysis failed to produce results.")
        else:
            print("Failed to load simulation data. Please ensure network.json and log.txt exist and contain valid data.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main() 