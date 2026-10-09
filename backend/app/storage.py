import os
import io
import uuid
from PIL import Image
from fastapi import UploadFile, HTTPException

def sanitize_and_save_photo(file: UploadFile, upload_dir: str, max_mb: int = 5) -> str:
    """
    Validates image size and type, strips EXIF metadata for privacy, and saves locally.
    Returns relative filename.
    """
    contents = file.file.read()
    if len(contents) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Photo exceeds {max_mb}MB limit.")

    try:
        img = Image.open(io.BytesIO(contents))
        # Validate format
        if img.format not in ["JPEG", "PNG", "WEBP"]:
            raise HTTPException(status_code=400, detail="Invalid image format. JPEG, PNG, WEBP allowed.")

        # Strip EXIF by re-creating clean image
        data = list(img.getdata())
        clean_img = Image.new(img.mode, img.size)
        clean_img.putdata(data)

        os.makedirs(upload_dir, exist_ok=True)
        file_ext = "jpg" if img.format == "JPEG" else img.format.lower()
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(upload_dir, filename)
        clean_img.save(filepath)
        return f"/photos/{filename}"
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Failed to process image file.")
