import requests
import argparse
import os

# Set your backend URL here
API_BASE_URL = "http://localhost:5000"

def upload_file(args):
    url = f"{API_BASE_URL}/api/admin/publish"
    
    if not os.path.exists(args.file):
        print(f"Error: File '{args.file}' not found.")
        return

    data = {
        'title': args.title,
        'category': args.category,
        'description': args.description,
        'type': args.type
    }

    if args.type == 'pdf':
        data['isFree'] = str(args.is_free).lower()
        data['price'] = args.price if not args.is_free else 0
    elif args.type == 'code':
        data['language'] = args.language

    print(f"Uploading {args.type.upper()}...")
    
    try:
        with open(args.file, 'rb') as f:
            files = {'file': (os.path.basename(args.file), f)}
            response = requests.post(url, data=data, files=files)
            
            if response.status_code == 200 or response.status_code == 201:
                print("Success! Upload complete.")
            else:
                print(f"Failed to upload. Status Code: {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload PDFs or Source Code to the Admin Portal.")
    
    parser.add_argument('type', choices=['pdf', 'code'], help="Type of file to upload: 'pdf' or 'code'")
    parser.add_argument('file', help="Path to the file to upload (.pdf or .zip)")
    parser.add_argument('--title', required=True, help="Title of the content")
    parser.add_argument('--category', required=True, help="Category of the content")
    parser.add_argument('--description', default='', help="Short description")
    
    # PDF specific arguments
    parser.add_argument('--is-free', action='store_true', default=True, help="Set if PDF is free (default: True)")
    parser.add_argument('--price', type=float, default=0, help="Price of the PDF if not free")
    
    # Code specific arguments
    parser.add_argument('--language', default='', help="Primary language for code upload")

    args = parser.parse_args()
    
    upload_file(args)
