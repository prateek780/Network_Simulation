#!/usr/bin/env python3
import sys
import json
import os
import argparse
from colorama import Fore, Style, init

# Initialize colorama for colored output
init()

class LogBacktracer:
    """
    A utility class for backtracking and exploring log entries by their log ID.
    Provides context around specific log entries and helps navigate the log file.
    """
    
    def __init__(self, log_file="log.txt", analysis_file="simulation.txt"):
        self.log_file = log_file
        self.analysis_file = analysis_file
        self.log_lines = []
        self.analysis_data = {}
        self.log_entries = []
        self.log_id_map = {}
    
    def load_data(self):
        """Load log file and analysis data"""
        try:
            # Load log file
            with open(self.log_file, 'r', encoding='utf-8') as f:
                self.log_lines = f.read().splitlines()
            
            # Generate log entries with IDs
            for i, line in enumerate(self.log_lines):
                if line.strip():  # Skip empty lines
                    log_id = f"LOG_{i:04d}"
                    self.log_entries.append({
                        "log_id": log_id,
                        "content": line.strip(),
                        "index": i
                    })
                    self.log_id_map[log_id] = i
            
            # Load analysis data
            if os.path.exists(self.analysis_file):
                with open(self.analysis_file, 'r', encoding='utf-8') as f:
                    self.analysis_data = json.load(f)
            else:
                print(f"Warning: Analysis file {self.analysis_file} not found")
                
            return True
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return False
    
    def lookup_log_id(self, log_id):
        """Look up a specific log entry by its ID and return context around it"""
        if not log_id.startswith("LOG_"):
            log_id = f"LOG_{log_id}"
        
        if log_id in self.log_id_map:
            index = self.log_id_map[log_id]
            return self.get_log_context(index)
        else:
            print(f"Log ID {log_id} not found")
            return None
    
    def get_log_context(self, index, context_lines=5):
        """Get context around a specific log line"""
        start = max(0, index - context_lines)
        end = min(len(self.log_lines), index + context_lines + 1)
        
        result = []
        for i in range(start, end):
            prefix = "  "
            if i == index:
                prefix = "➤ "
                line_text = f"{Fore.GREEN}{prefix}{self.log_lines[i]}{Style.RESET_ALL}"
            else:
                line_text = f"{prefix}{self.log_lines[i]}"
            
            result.append({
                "line_num": i,
                "log_id": f"LOG_{i:04d}",
                "content": self.log_lines[i],
                "is_target": (i == index),
                "display": line_text
            })
        
        return result
    
    def show_related_events(self, log_id):
        """Show related events from the analysis data"""
        if not self.analysis_data:
            return []
        
        related = []
        
        # Check if it's in references
        if "references" in self.analysis_data:
            for i, ref in enumerate(self.analysis_data["references"]):
                if ref.get("log_id") == log_id:
                    related.append({
                        "type": "reference",
                        "index": i,
                        "description": f"Referenced in summary: [{i}]"
                    })
        
        # Check if it's in significant events
        if "details" in self.analysis_data and "significant_events" in self.analysis_data["details"]:
            for event in self.analysis_data["details"]["significant_events"]:
                if event.get("log_id") == log_id:
                    related.append({
                        "type": "significant_event",
                        "description": f"Significant event: {event.get('event', 'Unknown')} ({event.get('component', 'Unknown')})"
                    })
        
        # Check if it's in errors
        if "details" in self.analysis_data and "errors" in self.analysis_data["details"]:
            for error in self.analysis_data["details"]["errors"]:
                if error.get("log_id") == log_id:
                    related.append({
                        "type": "error",
                        "description": f"Error: {error.get('error', 'Unknown')} ({error.get('component', 'Unknown')})"
                    })
        
        return related
    
    def find_related_components(self, log_id):
        """Find related components mentioned in the log entry"""
        if log_id not in self.log_id_map:
            return []
        
        index = self.log_id_map[log_id]
        line = self.log_lines[index]
        
        # List of known components from the analysis
        components = set()
        if "details" in self.analysis_data:
            if "significant_events" in self.analysis_data["details"]:
                for event in self.analysis_data["details"]["significant_events"]:
                    if "component" in event:
                        components.add(event["component"])
            
            if "errors" in self.analysis_data["details"]:
                for error in self.analysis_data["details"]["errors"]:
                    if "component" in error:
                        components.add(error["component"])
        
        # Find mentioned components in this log line
        mentioned = []
        for component in components:
            if component in line:
                mentioned.append(component)
        
        return mentioned
    
    def find_path(self, start_id, end_id=None, max_steps=10):
        """Find a path between two log entries based on component mentions"""
        if not start_id.startswith("LOG_"):
            start_id = f"LOG_{start_id}"
        
        if end_id and not end_id.startswith("LOG_"):
            end_id = f"LOG_{end_id}"
        
        if start_id not in self.log_id_map:
            print(f"Start log ID {start_id} not found")
            return []
        
        if end_id and end_id not in self.log_id_map:
            print(f"End log ID {end_id} not found")
            return []
        
        path = [start_id]
        current_id = start_id
        current_index = self.log_id_map[current_id]
        
        # If no end_id is specified, we'll just follow the flow
        # based on component mentions
        steps = 0
        while steps < max_steps:
            # Get components mentioned in current log
            components = self.find_related_components(current_id)
            if not components:
                break
            
            # Find the next log entry that mentions these components
            found_next = False
            for i in range(current_index + 1, len(self.log_lines)):
                next_id = f"LOG_{i:04d}"
                if next_id == end_id:
                    path.append(next_id)
                    return path
                
                for component in components:
                    if component in self.log_lines[i]:
                        path.append(next_id)
                        current_id = next_id
                        current_index = i
                        found_next = True
                        break
                
                if found_next:
                    break
            
            if not found_next or (end_id and current_id == end_id):
                break
            
            steps += 1
        
        return path
    
    def explore_log(self, log_id=None):
        """Interactive exploration of the logs, starting from specified log_id"""
        if not self.log_entries:
            print("No log entries available. Please load data first.")
            return
        
        current_index = 0
        if log_id:
            if not log_id.startswith("LOG_"):
                log_id = f"LOG_{log_id}"
            
            if log_id in self.log_id_map:
                current_index = self.log_id_map[log_id]
            else:
                print(f"Log ID {log_id} not found. Starting from beginning.")
        
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print(f"{Fore.CYAN}=== LOG EXPLORER ({self.log_file}) ==={Style.RESET_ALL}")
            print(f"Current position: {Fore.YELLOW}LOG_{current_index:04d}{Style.RESET_ALL}\n")
            
            # Display context around current log entry
            context = self.get_log_context(current_index)
            for entry in context:
                print(entry["display"])
            
            # Show related info if available
            current_log_id = f"LOG_{current_index:04d}"
            related = self.show_related_events(current_log_id)
            if related:
                print(f"\n{Fore.CYAN}Related Information:{Style.RESET_ALL}")
                for item in related:
                    print(f"  - {item['description']}")
            
            # Show components mentioned
            components = self.find_related_components(current_log_id)
            if components:
                print(f"\n{Fore.CYAN}Components Mentioned:{Style.RESET_ALL}")
                print(f"  {', '.join(components)}")
            
            # Navigation options
            print(f"\n{Fore.CYAN}Navigation:{Style.RESET_ALL}")
            print("  [n] Next log entry")
            print("  [p] Previous log entry")
            print("  [j] Jump to LOG_ID")
            print("  [f] Find path from this log")
            print("  [s] Search in logs")
            print("  [q] Quit")
            
            choice = input("\nEnter choice: ").lower()
            
            if choice == 'n':
                if current_index < len(self.log_lines) - 1:
                    current_index += 1
            elif choice == 'p':
                if current_index > 0:
                    current_index -= 1
            elif choice == 'j':
                jump_id = input("Enter LOG_ID (e.g., 0014 or LOG_0014): ")
                if not jump_id.startswith("LOG_"):
                    jump_id = f"LOG_{jump_id}"
                
                if jump_id in self.log_id_map:
                    current_index = self.log_id_map[jump_id]
                else:
                    input(f"Log ID {jump_id} not found. Press Enter to continue...")
            elif choice == 'f':
                end_id = input("Enter destination LOG_ID (leave empty to follow components): ")
                path = self.find_path(current_log_id, end_id if end_id else None)
                
                if path:
                    print(f"\n{Fore.CYAN}Path found:{Style.RESET_ALL}")
                    for i, log_id in enumerate(path):
                        index = self.log_id_map[log_id]
                        print(f"{i+1}. {log_id}: {self.log_lines[index]}")
                    input("\nPress Enter to continue...")
                else:
                    input("\nNo path found. Press Enter to continue...")
            elif choice == 's':
                search_term = input("Enter search term: ")
                if search_term:
                    results = []
                    for i, line in enumerate(self.log_lines):
                        if search_term.lower() in line.lower():
                            results.append({"index": i, "log_id": f"LOG_{i:04d}", "content": line})
                    
                    if results:
                        print(f"\n{Fore.CYAN}Search results for '{search_term}':{Style.RESET_ALL}")
                        for i, result in enumerate(results[:10]):  # Limit to 10 results
                            print(f"{i+1}. {result['log_id']}: {result['content']}")
                        
                        if len(results) > 10:
                            print(f"... and {len(results) - 10} more results.")
                        
                        sel = input("\nJump to result number (or Enter to cancel): ")
                        if sel.isdigit() and 1 <= int(sel) <= min(10, len(results)):
                            current_index = results[int(sel)-1]["index"]
                    else:
                        input(f"No results found for '{search_term}'. Press Enter to continue...")
            elif choice == 'q':
                break

def main():
    parser = argparse.ArgumentParser(description="Log backtracing utility for network simulation logs")
    parser.add_argument("--log", default="log.txt", help="Path to the log file")
    parser.add_argument("--analysis", default="simulation.txt", help="Path to the analysis JSON file")
    parser.add_argument("--id", help="Log ID to start exploration from")
    parser.add_argument("--lookup", help="Look up a specific log ID without interactive mode")
    parser.add_argument("--path", help="Find path from specified log ID to destination (use with --to)")
    parser.add_argument("--to", help="Destination log ID for path finding")
    
    args = parser.parse_args()
    
    backtracer = LogBacktracer(args.log, args.analysis)
    if not backtracer.load_data():
        return 1
    
    if args.lookup:
        context = backtracer.lookup_log_id(args.lookup)
        if context:
            print(f"\n{Fore.CYAN}=== LOG CONTEXT ({args.lookup}) ==={Style.RESET_ALL}")
            for entry in context:
                print(entry["display"])
            
            # Show related info if available
            related = backtracer.show_related_events(args.lookup)
            if related:
                print(f"\n{Fore.CYAN}Related Information:{Style.RESET_ALL}")
                for item in related:
                    print(f"  - {item['description']}")
            return 0
    elif args.path and args.to:
        path = backtracer.find_path(args.path, args.to)
        if path:
            print(f"\n{Fore.CYAN}=== PATH FROM {args.path} TO {args.to} ==={Style.RESET_ALL}")
            for i, log_id in enumerate(path):
                index = backtracer.log_id_map[log_id]
                print(f"{i+1}. {log_id}: {backtracer.log_lines[index]}")
            return 0
        else:
            print(f"No path found from {args.path} to {args.to}")
            return 1
    else:
        # Interactive mode
        backtracer.explore_log(args.id)
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 