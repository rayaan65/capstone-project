from setuptools import setup, find_packages

setup(
    name="insightflow",
    version="1.0.0",
    description="A data analysis and visualization web application",
    author="InsightFlow Team",
    author_email="info@insightflow.com",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "Flask>=3.1.0",
        "Werkzeug>=3.1.3",
        "pandas>=2.2.0",
        "numpy>=2.2.0",
        "matplotlib>=3.0.0",
        "seaborn>=0.12.0",
        "openpyxl>=3.0.0",
        "xlrd>=2.0.0",
    ],
    python_requires=">=3.8",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
) 