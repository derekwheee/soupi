import sys
import json
import os
import argparse
from pathlib import Path

# Add the script's directory to Python path to find local modules
script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(str(script_dir))

import scraper
from ingredient_parser import parse_ingredient

def ingredient_to_dict(ingredient):
    def text_to_dict(text_obj):
        if text_obj is None:
            return None
        return {
            "text": text_obj.text,
            "confidence": text_obj.confidence,
            "starting_index": text_obj.starting_index
        }

    def amount_to_dict(amount_obj):
        if amount_obj is None:
            return None
        return {
            "quantity": float(amount_obj.quantity),
            "quantity_max": float(amount_obj.quantity_max),
            "unit": str(amount_obj.unit),
            "text": amount_obj.text,
            "confidence": amount_obj.confidence,
            "starting_index": amount_obj.starting_index,
            "APPROXIMATE": amount_obj.APPROXIMATE,
            "SINGULAR": amount_obj.SINGULAR,
            "RANGE": amount_obj.RANGE,
            "MULTIPLIER": amount_obj.MULTIPLIER,
            "PREPARED_INGREDIENT": amount_obj.PREPARED_INGREDIENT
        }

    return {
        "name": [text_to_dict(n) for n in ingredient.name],
        "size": text_to_dict(ingredient.size),  # <-- convert size properly
        "amount": [amount_to_dict(a) for a in ingredient.amount],
        "preparation": text_to_dict(ingredient.preparation),  # already handled
        "comment": text_to_dict(ingredient.comment),
        "purpose": text_to_dict(ingredient.purpose),
        "foundation_foods": [text_to_dict(n) for n in ingredient.foundation_foods],
        "sentence": ingredient.sentence
    }


def parse_ingredients(raw_ingredients):
    """Parse raw ingredient strings into structured data using ingredient-parser"""
    parsed = []
    
    for raw_ingredient in raw_ingredients:
        try:
            ingredient = parse_ingredient(raw_ingredient)
            parsed.append(ingredient)
        except Exception as e:
            print(f"Error parsing ingredient '{raw_ingredient}': {e}", file=sys.stderr)
            parsed.append({
                "raw": raw_ingredient,
                "error": str(e)
            })
    
    return parsed

def main():
    
    # CLI usage
    # -f, --file <file> : A file containing a list of ingredient strings (one per line)
    # -u, --url <url>   : A URL of a recipe page to scrape and parse
    # -s, --sentence <sentence> : A single ingredient sentence to parse
    parser = argparse.ArgumentParser(description="Parse ingredient sentences.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-f", "--file", type=str, help="File with ingredient strings (one per line)")
    group.add_argument("-u", "--url", type=str, help="URL of a recipe page to scrape and parse")
    group.add_argument("-s", "--sentence", type=str, help="Single ingredient sentence to parse")
    group.add_argument("-j", "--json", type=str, help="JSON file with ingredient strings")
    parser.add_argument("-o", "--output", type=str, help="Output JSON file path (if not provided, prints to stdout)", default=None)

    args = parser.parse_args()
    ingredients = None
    
    if args.file:
        try:
            with open(args.file, 'r') as f:
                ingredients = [line.strip() for line in f if line.strip()]
        except Exception as e:
            print(json.dumps({
                'error': f'Failed to read file: {e}'
            }))
            sys.exit(1)
    elif args.sentence:
        ingredients = [args.sentence.strip()]
    elif args.url:
        url = args.url.strip()
        # Scrape recipe
        recipe_data = scraper.RecipeScraper().scrape_recipe(url)
        if 'error' in recipe_data:
            print(json.dumps(recipe_data))
            sys.exit(1)
        if recipe_data.get('ingredients'):
            ingredients = recipe_data['ingredients']
    elif args.json:
        ingredients = json.loads(args.json)
    
    # Parse ingredients
    if ingredients:
        parsed_ingredients = parse_ingredients(ingredients)
        result = [ingredient_to_dict(pi) for pi in parsed_ingredients]
        
        try:
            if args.output:
                # Convert relative path to absolute path if necessary
                output_path = args.output if os.path.isabs(args.output) else os.path.abspath(args.output)
                with open(output_path, "w") as f:
                    json.dump(result, f, indent=2)
                print(json.dumps({
                    'status': 'success',
                    'parsed_count': len(parsed_ingredients),
                    'output_file': output_path
                }))
            else:
                # Print results directly to stdout
                print(json.dumps(result, indent=2))
        except Exception as e:
            print(f"Error writing to file: {e}", file=sys.stderr)
            print([ingredient_to_dict(pi) for pi in parsed_ingredients])
    else:
        recipe_data['error'] = 'No ingredients found on page'
        
if __name__ == '__main__':
    main()