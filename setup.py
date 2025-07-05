from setuptools import setup

setup(
    name="aimakerspace",
    version="0.1.0",
    package_dir={"": "src"},
    packages=["aimakerspace", "aimakerspace.openai_utils"],
    install_requires=[
        "openai>=1.0.0",
        "python-dotenv>=1.0.0",
        "PyPDF2>=3.0.0",
        "numpy>=1.0.0",
    ],
    description="AI Maker Space utilities for PDF processing and RAG",
    author="Forest AI Team",
    author_email="team@forestai.com",
    url="https://github.com/yourusername/aie-chatbot-challenge",
) 