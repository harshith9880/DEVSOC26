# Install: pip install backboard-sdk
import asyncio
from backboard import BackboardClient
from dotenv import load_dotenv

load_dotenv()

async def main():
    # Initialize the Backboard client
    client = BackboardClient(api_key="espr_bF3RJTj4oatawA6x4llG6HutCozuridek_TGxFY6z7Q")

    # Create an assistant
    assistant = await client.create_assistant(
        name="My First Assistant",
        system_prompt="An assistant that decides the kind of loan repayment strategy based on user payment behaviour"
    )

    # Create a thread
    thread = await client.create_thread(assistant.assistant_id)

    # Send a message and get the complete response
    response = await client.add_message(
        thread_id=thread.thread_id,
        content="The user does not pay his EMI on time and always pays late with fines and still has unpaid EMI for past 2 months",
        llm_provider="google",
        model_name="gemini-2.5-flash-preview-09-2025",
        stream=False
    )

    # Print the AI's response
    print(response.content)

if __name__ == "__main__":
    asyncio.run(main())