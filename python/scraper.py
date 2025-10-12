import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urlparse

class RecipeScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def fetch_page(self, url):
        """Fetch the HTML content of a URL"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching URL: {e}")
            return None
    
    def extract_json_ld(self, soup):
        """Extract recipe data from JSON-LD structured data"""
        # Many recipe sites use JSON-LD Schema.org format
        scripts = soup.find_all('script', type='application/ld+json')
        
        for script in scripts:
            try:
                data = json.loads(script.string)
                
                # Handle both single recipe and array of items
                if isinstance(data, list):
                    for item in data:
                        if self._is_recipe(item):
                            return item
                elif self._is_recipe(data):
                    return data
                # Sometimes recipe is nested in @graph
                elif '@graph' in data:
                    for item in data['@graph']:
                        if self._is_recipe(item):
                            return item
            except (json.JSONDecodeError, TypeError):
                continue
        
        return None
    
    def _is_recipe(self, data):
        """Check if JSON-LD data is a recipe"""
        if isinstance(data, dict):
            type_val = data.get('@type', '')
            if isinstance(type_val, list):
                return 'Recipe' in type_val
            return type_val == 'Recipe'
        return False
    
    def parse_json_ld_recipe(self, recipe_data):
        """Parse recipe data from JSON-LD format"""
        recipe = {
            'name': recipe_data.get('name', ''),
            'description': recipe_data.get('description', ''),
            'author': self._extract_author(recipe_data),
            'prep_time': recipe_data.get('prepTime', ''),
            'cook_time': recipe_data.get('cookTime', ''),
            'total_time': recipe_data.get('totalTime', ''),
            'recipe_yield': recipe_data.get('recipeYield', ''),
            'recipe_category': recipe_data.get('recipeCategory', ''),
            'recipe_cuisine': recipe_data.get('recipeCuisine', ''),
            'keywords': recipe_data.get('keywords', ''),
            'ingredients': self._extract_ingredients(recipe_data),
            'instructions': self._extract_instructions(recipe_data),
            'nutrition': recipe_data.get('nutrition', {}),
            'image': self._extract_image(recipe_data)
        }
        
        return recipe
    
    def _extract_author(self, recipe_data):
        """Extract author information"""
        author = recipe_data.get('author', '')
        if isinstance(author, dict):
            return author.get('name', '')
        elif isinstance(author, list) and len(author) > 0:
            if isinstance(author[0], dict):
                return author[0].get('name', '')
            return str(author[0])
        return str(author)
    
    def _extract_ingredients(self, recipe_data):
        """Extract ingredients list"""
        ingredients = recipe_data.get('recipeIngredient', [])
        if not ingredients:
            ingredients = recipe_data.get('ingredients', [])
        
        # Ensure it's a list
        if isinstance(ingredients, str):
            ingredients = [ingredients]
        
        return ingredients
    
    def _extract_instructions(self, recipe_data):
        """Extract cooking instructions"""
        instructions = recipe_data.get('recipeInstructions', [])
        
        if not instructions:
            return []
        
        # Handle different instruction formats
        parsed_instructions = []
        
        if isinstance(instructions, str):
            # Simple text instructions
            return [instructions]
        
        elif isinstance(instructions, list):
            for idx, step in enumerate(instructions, 1):
                if isinstance(step, str):
                    parsed_instructions.append({
                        'step': idx,
                        'text': step
                    })
                elif isinstance(step, dict):
                    # HowToStep format
                    if step.get('@type') == 'HowToStep':
                        parsed_instructions.append({
                            'step': idx,
                            'name': step.get('name', ''),
                            'text': step.get('text', '')
                        })
                    # HowToSection format
                    elif step.get('@type') == 'HowToSection':
                        section_name = step.get('name', f'Section {idx}')
                        section_steps = step.get('itemListElement', [])
                        for substep in section_steps:
                            if isinstance(substep, dict):
                                parsed_instructions.append({
                                    'step': len(parsed_instructions) + 1,
                                    'section': section_name,
                                    'text': substep.get('text', '')
                                })
                    else:
                        # Generic dict with text
                        text = step.get('text', '') or step.get('description', '')
                        if text:
                            parsed_instructions.append({
                                'step': idx,
                                'text': text
                            })
        
        return parsed_instructions
    
    def _extract_image(self, recipe_data):
        """Extract recipe image URL"""
        image = recipe_data.get('image', '')
        
        if isinstance(image, dict):
            return image.get('url', '')
        elif isinstance(image, list) and len(image) > 0:
            if isinstance(image[0], dict):
                return image[0].get('url', '')
            return str(image[0])
        
        return str(image) if image else ''
    
    def fallback_scrape(self, soup, url):
        """Fallback method to scrape recipe without JSON-LD"""
        recipe = {
            'name': '',
            'description': '',
            'author': '',
            'prep_time': '',
            'cook_time': '',
            'total_time': '',
            'recipe_yield': '',
            'recipe_category': '',
            'recipe_cuisine': '',
            'keywords': '',
            'ingredients': [],
            'instructions': [],
            'nutrition': {},
            'image': '',
            'source_url': url
        }
        
        # Try to find recipe name
        title = soup.find('h1')
        if title:
            recipe['name'] = title.get_text(strip=True)
        
        # Try to find ingredients
        # Common class names for ingredients
        ingredient_selectors = [
            'li[class*="ingredient"]',
            'li[class*="Ingredient"]',
            'span[class*="ingredient"]',
            '[itemprop="recipeIngredient"]',
            'ul.ingredients li',
            'div.ingredients li'
        ]
        
        for selector in ingredient_selectors:
            ingredients = soup.select(selector)
            if ingredients:
                recipe['ingredients'] = [ing.get_text(strip=True) for ing in ingredients]
                break
        
        # Try to find instructions
        instruction_selectors = [
            'li[class*="instruction"]',
            'li[class*="step"]',
            'ol[class*="instruction"] li',
            'ol[class*="step"] li',
            '[itemprop="recipeInstructions"]'
        ]
        
        for selector in instruction_selectors:
            instructions = soup.select(selector)
            if instructions:
                recipe['instructions'] = [
                    {'step': idx + 1, 'text': inst.get_text(strip=True)}
                    for idx, inst in enumerate(instructions)
                ]
                break
        
        return recipe
    
    def scrape_recipe(self, url):
        """Main method to scrape recipe from URL"""
        print(f"Scraping recipe from: {url}")
        
        html = self.fetch_page(url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Try to extract JSON-LD data first
        json_ld = self.extract_json_ld(soup)
        
        if json_ld:
            print("Found JSON-LD structured data")
            recipe = self.parse_json_ld_recipe(json_ld)
        else:
            print("No JSON-LD found, using fallback scraping")
            recipe = self.fallback_scrape(soup, url)
        
        # Add source URL
        recipe['source_url'] = url
        
        return recipe
    
    def save_to_json(self, recipe, filename='recipe.json'):
        """Save recipe to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(recipe, f, indent=2, ensure_ascii=False)
        print(f"Recipe saved to {filename}")


def main():
    scraper = RecipeScraper()
    
    # Example URLs to test
    # These are popular recipe sites that typically have good structured data
    test_urls = [
        "https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/",
        "https://www.foodnetwork.com/recipes/alton-brown/good-eats-roast-turkey-recipe-1950271",
        "https://www.bbcgoodfood.com/recipes/classic-lasagne"
    ]
    
    # Prompt for URL or use test URL
    print("Recipe Scraper")
    print("=" * 50)
    user_url = input("Enter recipe URL (or press Enter to use test URL): ").strip()
    
    if not user_url:
        url = test_urls[0]
        print(f"Using test URL: {url}")
    else:
        url = user_url
    
    # Scrape the recipe
    recipe = scraper.scrape_recipe(url)
    
    if recipe:
        print("\nRecipe extracted successfully!")
        print("=" * 50)
        print(f"Name: {recipe.get('name', 'N/A')}")
        print(f"Author: {recipe.get('author', 'N/A')}")
        print(f"Prep Time: {recipe.get('prep_time', 'N/A')}")
        print(f"Cook Time: {recipe.get('cook_time', 'N/A')}")
        print(f"Total Time: {recipe.get('total_time', 'N/A')}")
        print(f"Yield: {recipe.get('recipe_yield', 'N/A')}")
        print(f"\nIngredients ({len(recipe.get('ingredients', []))}):")
        for ing in recipe.get('ingredients', [])[:5]:
            print(f"  - {ing}")
        if len(recipe.get('ingredients', [])) > 5:
            print(f"  ... and {len(recipe.get('ingredients', [])) - 5} more")
        
        print(f"\nInstructions ({len(recipe.get('instructions', []))}):")
        for inst in recipe.get('instructions', [])[:3]:
            if isinstance(inst, dict):
                print(f"  {inst.get('step', '')}. {inst.get('text', '')[:100]}...")
            else:
                print(f"  {str(inst)[:100]}...")
        if len(recipe.get('instructions', [])) > 3:
            print(f"  ... and {len(recipe.get('instructions', [])) - 3} more steps")
        
        # Save to JSON
        print("\n" + "=" * 50)
        save_choice = input("Save to JSON file? (y/n): ").strip().lower()
        if save_choice == 'y':
            filename = input("Enter filename (default: recipe.json): ").strip() or "recipe.json"
            scraper.save_to_json(recipe, filename)
            
            # Pretty print the JSON
            print("\nJSON Output:")
            print(json.dumps(recipe, indent=2))
    else:
        print("Failed to extract recipe")


if __name__ == "__main__":
    main()