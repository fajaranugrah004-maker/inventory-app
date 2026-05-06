"""Generate app icon for Inventory Management App using Gemini Nano Banana."""
import asyncio
import os
import base64
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

ICON_PROMPT = """Create a clean, modern, minimalist app icon for an inventory management mobile app.

Design requirements:
- Square 1024x1024 pixel format
- Centered geometric icon: a stylized cardboard box / package with a checkmark or simple inventory symbol
- Color palette: primary green #16a34a (vibrant emerald green), accent light green #dcfce7, soft gray #6b7280, white #ffffff
- Background: clean white or very light gray (#fafafa) with subtle rounded square frame
- Style: flat design, minimalist, modern, professional, friendly
- No text, no letters, no words
- Soft rounded corners on the box shape
- Simple, recognizable at small sizes
- Inspired by Material Design and iOS app icons
- Single object only — no multiple elements
- High contrast, clear silhouette
"""

async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("ERROR: EMERGENT_LLM_KEY not found")
        return

    chat = LlmChat(
        api_key=api_key,
        session_id="icon-gen-inventory",
        system_message="You are an expert app icon designer specializing in clean, minimalist mobile app icons.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"]
    )

    msg = UserMessage(text=ICON_PROMPT)
    text, images = await chat.send_message_multimodal_response(msg)
    print(f"Text response: {text[:200] if text else '(none)'}")

    if not images:
        print("No images generated")
        return

    img = images[0]
    image_bytes = base64.b64decode(img["data"])
    out_path = "/app/frontend/assets/images/icon.png"
    with open(out_path, "wb") as f:
        f.write(image_bytes)
    print(f"Saved icon to {out_path} ({len(image_bytes)} bytes)")


if __name__ == "__main__":
    asyncio.run(main())
