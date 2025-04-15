# Network Simulator

A hybrid classical-quantum network simulator for testing and development purposes.

## Project Structure

```
simulator_1/
├── classical_network/ # Classical network simulation components
├── core/              # Core simulation engine
├── quantum_network/   # Quantum network simulation components
├── server/            # API server implementation
├── ui/                # User interface
├── utils/             # Utility functions and helpers
├── json_parser.py     # Start simulator by parsing json file
├── main.py            # Main entry point for Python CLI based simulator (No UI)
├── requirements.txt   # Python dependencies
└── start.py           # Startup script (API Server)
```

## Overview

This simulator provides a dual-purpose environment for testing both classical and quantum network interactions. It can be used for research, development, and educational purposes.

## Installation

1. Create and activate a virtual environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Install node packages for UI:
   ```
   cd ui
   npm install
   ```

## GUI Usage

Start the API Server:
```
python start.py
```

Start UI:
```
cd ui
npm run dev
```

## CLI Usage

Or run the main application directly:
```
python main.py
```

## Configuration

Network topology and parameters can be configured in the `network.json` file.

## Components

- **Classical Network**: Traditional network simulation
- **Quantum Network**: Quantum communication protocols and algorithms
- **Core**: Central simulation engine that coordinates between classical and quantum components
- **Server**: Backend server for remote access and control
- **UI**: User interface for visualization and interaction

## Output

The simulator produces various outputs:
- Text logs in `logs/` directory and `log.txt`
- Visualization images (`out.png`, `out_parsed.png`)
- Textual results (`out.txt`)
