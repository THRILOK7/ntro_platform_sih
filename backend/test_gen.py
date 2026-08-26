import asyncio
from dotenv import load_dotenv
from generator import generate_with_retry
from prompts import IngestionParameters

# Load environment variables from .env
load_dotenv()

async def test():
    params = IngestionParameters(
        target_audience="General Public",
        tone="Formal",
        language="English",
        detail_level="Brief",
        selected_outputs=["Executive Summary"]
    )

    text = "This is a test of the NTRO platform ingestion engine."

    try:
        result = await generate_with_retry(text, params)
        print("✅ Generation successful!")
        print(result)
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
