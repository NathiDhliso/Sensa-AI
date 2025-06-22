from setuptools import setup, find_packages

setup(
    name="sensa-agents",
    version="1.0.0",
    description="Sensa AI Multi-Agent System",
    packages=find_packages(),
    install_requires=[
        "google-generativeai>=0.3.0",
        "supabase>=2.0.0",
        "pydantic>=2.0.0",
        "httpx>=0.25.0",
        "python-dotenv>=1.0.0",
        "functions-framework>=3.0.0"
    ],
    python_requires=">=3.9",
) 