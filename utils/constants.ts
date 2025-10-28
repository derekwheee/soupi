export const DEFAULT_CATEGORIES = [
    { icon: '🍎', name: 'Produce', sortOrder: 0 },
    { icon: '🍞', name: 'Bakery', sortOrder: 1 },
    { icon: '🧀', name: 'Deli', sortOrder: 2 },
    { icon: '🍖', name: 'Meat & Seafood', sortOrder: 3 },
    { icon: '🥫', name: 'Grocery', sortOrder: 4 },
    { icon: '🧂', name: 'Condiments & Spices', sortOrder: 5 },
    { icon: '🍰', name: 'Baking', sortOrder: 6 },
    { icon: '🍝', name: 'Pasta, Rice & Grains', sortOrder: 7 },
    { icon: '🥫', name: 'Canned Goods', sortOrder: 8 },
    { icon: '🥨', name: 'Snacks', sortOrder: 9 },
    { icon: '🧃', name: 'Beverages', sortOrder: 10 },
    { icon: '🥛', name: 'Dairy', sortOrder: 11 },
    { icon: '🍦', name: 'Frozen', sortOrder: 12 },
    { icon: '🍼', name: 'Baby & Kids', sortOrder: 13, isNonFood: true },
    { icon: '🐾', name: 'Pet Supplies', sortOrder: 14, isNonFood: true },
    { icon: '🧼', name: 'Cleaning Supplies', sortOrder: 15, isNonFood: true },
    { icon: '🧴', name: 'Household', sortOrder: 16, isNonFood: true },
    { icon: '🪥', name: 'Personal Care', sortOrder: 17, isNonFood: true },
    { icon: '💊', name: 'Health', sortOrder: 18, isNonFood: true },
    { icon: '🛠️', name: 'Hardware', sortOrder: 19, isNonFood: true },
    { icon: '🛒', name: 'Other', sortOrder: 20 },
];

export const DEFAuLT_TAGS = [
    { name: 'breakfast' },
    { name: 'brunch' },
    { name: 'lunch' },
    { name: 'dinner' },
    { name: 'dessert' },
    { name: 'side dish' },
    { name: 'easy' },
    { name: 'quick' },
    { name: 'vegetarian' },
];

export enum SSEMessageType {
    RECIPE_UPDATE = 'recipe_update',
    RECIPE_DELETE = 'recipe_delete',
    PANTRY_UPDATE = 'pantry_update',
    CATEGORY_UPDATE = 'category_update',
}