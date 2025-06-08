// src/types/index.ts

// Re-export all types from shop.ts
export * from './shop';

// You can add re-exports from other type definition files here as your project grows
// For example, if you had types specific to user authentication:
// export * from './auth';

// Or types for your AppContext state if it becomes very complex and you want to define it here:
// export * from './appContextState';

// Example of a utility type you might define here or in its own file
export type FilterableProductKey = keyof Pick<
  Shop,
  | 'beef'
  | 'pork'
  | 'lamb'
  | 'chicken'
  | 'turkey'
  | 'duck'
  | 'eggs'
  | 'corn'
  | 'carrots'
  | 'potatoes'
  | 'lettus'
  | 'spinach'
  | 'squash'
  | 'tomatoes'
  | 'peppers'
  | 'cucumbers'
  | 'zucchini'
  | 'garlic'
  | 'onions'
  | 'strawberries'
  | 'blueberries'
  // Add any other product boolean keys from the Shop interface
>;