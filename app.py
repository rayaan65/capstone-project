from flask import Flask, render_template, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import os
import json
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import uuid


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['STATIC_FOLDER'] = 'static'

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['STATIC_FOLDER'], 'images'), exist_ok=True)

# Store uploaded dataframes in memory
session_data = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if file:
        # Generate a session ID for this upload
        session_id = str(uuid.uuid4())
        
        # Save file temporarily
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{session_id}_{file.filename}")
        file.save(file_path)
        
        try:
            # Try to read the file as CSV
            df = pd.read_csv(file_path)
            
            # Store dataframe in memory
            session_data[session_id] = {
                'df': df,
                'filename': file.filename
            }
            
            # Get basic info about the dataframe
            columns = df.columns.tolist()
            dtypes = df.dtypes.apply(lambda x: str(x)).to_dict()
            preview = df.head(5).to_dict(orient='records')
            stats = {
                'rows': len(df),
                'columns': len(columns),
                'missing_values': df.isna().sum().to_dict()
            }
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'columns': columns,
                'dtypes': dtypes,
                'preview': preview,
                'stats': stats
            })
            
        except Exception as e:
            return jsonify({'error': str(e)})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    session_id = data.get('session_id')
    analysis_type = data.get('analysis_type')
    
    if session_id not in session_data:
        return jsonify({'error': 'Session expired or invalid'})
    
    df = session_data[session_id]['df']
    
    if analysis_type == 'summary':
        # Generate summary statistics
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        summary = df[numeric_cols].describe().to_dict()
        
        return jsonify({
            'success': True,
            'summary': summary
        })
        
    elif analysis_type == 'correlation':
        # Generate correlation matrix for numeric columns
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.shape[1] < 2:
            return jsonify({'error': 'Need at least 2 numeric columns for correlation'})
            
        corr_matrix = numeric_df.corr().to_dict()
        
        # Create correlation heatmap
        plt.figure(figsize=(10, 8))
        plt.matshow(numeric_df.corr(), fignum=1)
        plt.colorbar()
        plt.xticks(range(len(numeric_df.columns)), numeric_df.columns, rotation=90)
        plt.yticks(range(len(numeric_df.columns)), numeric_df.columns)
        
        # Save plot to a temporary file
        img_path = os.path.join(app.config['STATIC_FOLDER'], 'images', f"{session_id}_correlation.png")
        plt.savefig(img_path)
        plt.close()
        
        return jsonify({
            'success': True,
            'correlation': corr_matrix,
            'plot_url': f"/static/images/{session_id}_correlation.png"
        })
        
    elif analysis_type == 'histogram':
        column = data.get('column')
        if column not in df.columns:
            return jsonify({'error': 'Column not found'})
            
        if not pd.api.types.is_numeric_dtype(df[column]):
            return jsonify({'error': 'Column must be numeric for histogram'})
        
        plt.figure(figsize=(10, 6))
        plt.hist(df[column].dropna(), bins=30, alpha=0.7)
        plt.title(f'Histogram of {column}')
        plt.xlabel(column)
        plt.ylabel('Frequency')
        
        # Save plot
        img_path = os.path.join(app.config['STATIC_FOLDER'], 'images', f"{session_id}_histogram.png")
        plt.savefig(img_path)
        plt.close()
        
        return jsonify({
            'success': True,
            'plot_url': f"/static/images/{session_id}_histogram.png"
        })
        
    elif analysis_type == 'scatter':
        x_col = data.get('x_column')
        y_col = data.get('y_column')
        
        if x_col not in df.columns or y_col not in df.columns:
            return jsonify({'error': 'One or more columns not found'})
            
        if not (pd.api.types.is_numeric_dtype(df[x_col]) and pd.api.types.is_numeric_dtype(df[y_col])):
            return jsonify({'error': 'Both columns must be numeric for scatter plot'})
        
        plt.figure(figsize=(10, 6))
        plt.scatter(df[x_col], df[y_col], alpha=0.5)
        plt.title(f'Scatter Plot: {x_col} vs {y_col}')
        plt.xlabel(x_col)
        plt.ylabel(y_col)
        
        # Save plot
        img_path = os.path.join(app.config['STATIC_FOLDER'], 'images', f"{session_id}_scatter.png")
        plt.savefig(img_path)
        plt.close()
        
        return jsonify({
            'success': True,
            'plot_url': f"/static/images/{session_id}_scatter.png"
        })
    
    return jsonify({'error': 'Invalid analysis type'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)