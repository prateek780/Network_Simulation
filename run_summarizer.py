from log_summarizer import LogSummarizer

def main():
    summarizer = LogSummarizer()
    simulation_data = summarizer.load_simulation_data()
            
    if simulation_data:
        result = summarizer.analyze_simulation(simulation_data)
        if result:
            print('\nSimulation Analysis Summary:')
            print(result)
                    
            # Save the summary to a new file
            with open('latest_network_analysis.txt', 'w') as f:
                f.write(result)
            print('\nDetailed summary has been saved to latest_network_analysis.txt')
        else:
            print('Analysis failed to produce results.')
    else:
        print('Failed to load simulation data')

if __name__ == "__main__":
    main() 