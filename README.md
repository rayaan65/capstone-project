# InsightFlow

A web-based data analysis and visualization tool that helps users explore and gain insights from their data.

## Features

- Upload CSV and Excel files
- View data statistics and summaries
- Generate visualizations including histograms, bar charts, scatter plots and correlation matrices
- User authentication and file management

## Installation

### Using pip

```bash
# Clone the repository
git clone https://github.com/yourusername/insightflow.git
cd insightflow

# Install the package in development mode
pip install -e .
```

### Using requirements.txt

```bash
# Clone the repository
git clone https://github.com/yourusername/insightflow.git
cd insightflow

# Install dependencies
pip install -r requirements.txt
```

## Usage

Run the Flask development server:

```bash
python app.py
```

Then open your browser and navigate to:
- http://localhost:8080/

## Dependencies

- Flask 3.1.0
- Werkzeug 3.1.3
- pandas 2.2.0+
- numpy 2.2.0+
- matplotlib 3.0.0+
- seaborn 0.12.0+
- openpyxl 3.0.0+
- xlrd 2.0.0+

## License

MIT 