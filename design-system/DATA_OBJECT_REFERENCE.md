# PromptAtrium Data Object Reference

> **Purpose:** Quick-reference guide for all data objects in the prompt system  
> **Usage:** Keep this open while redesigning to maintain data consistency  
> **Created:** December 2024

---

## Quick Reference Table

| Object | Table | Purpose | Key Fields | API Endpoint |
|--------|-------|---------|-----------|--------------|
| **Prompt** | `prompts` | Main prompt entity | id, name, promptContent, userId, isPublic | `/api/prompts` |
| **PromptLike** | `promptLikes` | User engagement | userId, promptId | `/api/prompts/{id}/like` |
| **PromptFavorite** | `promptFavorites` | User bookmarks | userId, promptId | `/api/prompts/{id}/favorite` |
| **PromptRating** | `promptRatings` | User feedback | userId, promptId, rating | `/api/prompts/{id}/rate` |
| **Collection** | `collections` | Prompt grouping | id, name, type (user/community/global) | `/api/collections` |
| **PromptCommunitySharing** | `promptCommunitySharing` | Multi-community sharing | promptId, communityId, sharedBy | `/api/prompts/{id}/visibility` |
| **Community** | `communities` | User groups | id, name, slug, level, parentCommunityId | `/api/communities` |
| **User** | `users` | User accounts | id, email, username, role | `/api/auth/user` |

---

## Prompt Object (Core)

### TypeScript Type Definition

```typescript
// Selected from database
type Prompt = {
  // Identity
  id: string;                    // Primary key (char 10)
  userId: string;                // Owner UUID
  
  // Core content
  name: string;                  // Title
  description?: string;          // Long description
  promptContent: string;         // THE ACTUAL PROMPT TEXT
  negativePrompt?: string;       // What to exclude
  
  // Categorization
  categories?: string[];         // ["Art", "Photography"]
  promptTypes?: string[];        // ["Image Generation"]
  promptStyles?: string[];       // ["Cinematic"]
  tags?: string[];              // Search tags
  tagsNormalized?: string[];    // Lowercase for search
  
  // Visibility & Status
  isPublic: boolean;            // Can others see?
  isFeatured: boolean;          // Featured flag
  isHidden: boolean;            // Hide from search
  isNsfw: boolean;              // Content warning
  status: "draft" | "published" | "archived";
  
  // Metadata
  exampleImagesUrl?: string[];  // Image URLs
  notes?: string;               // Creator notes
  version: number;              // Version number
  branchOf?: string;            // Parent prompt ID (for copies)
  
  // Engagement metrics
  likes: number;                // Like count (from promptLikes table)
  usageCount: number;           // Times used
  qualityScore: number;         // 0-1 rating
  
  // Community context
  subCommunityId?: string;      // Which community owns it
  subCommunityVisibility?: "private" | "parent_community" | "public";
  
  // Advanced properties
  technicalParams?: {           // AI model parameters
    aspectRatio?: string;
    resolution?: string;
    samplingMethod?: string;
    steps?: number;
    scale?: number;
  };
  variables?: {                 // Template variables
    [key: string]: string;
  };
  additionalMetadata?: object;  // Custom fields
  
  // Relationships
  projectId?: string;           // Associated project
  collectionId?: string;        // Default collection
  collectionIds?: string[];     // All collections
  relatedPrompts?: string[];    // Related prompt IDs
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
};
```

### Create/Update Schema

```typescript
// Frontend: Zod schema
const insertPromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  promptContent: z.string().min(1),  // REQUIRED
  negativePrompt: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]),
  // ... more fields
});

type InsertPrompt = z.infer<typeof insertPromptSchema>;
```

### Relationships

```
Prompt (1) ──→ (Many) PromptLike
Prompt (1) ──→ (Many) PromptFavorite
Prompt (1) ──→ (Many) PromptRating
Prompt (Many) ──→ (Many) Collection (via promptsToCollections)
Prompt (Many) ──→ (Many) Community (via promptCommunitySharing)
Prompt ──→ User (owner)
Prompt (1) ──→ (Many) Prompt (branchOf relationship)
```

---

## PromptLike Object

### What It Does

Tracks who liked which prompts. One entry per user per prompt.

### Database Schema

```typescript
export const promptLikes = pgTable("prompt_likes", {
  id: varchar("id").primaryKey(),           // UUID
  userId: varchar("user_id").notNull(),     // Who liked
  promptId: char("prompt_id", {length: 10}).notNull(), // What was liked
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLike: unique().on(table.userId, table.promptId),
}));
```

### Operations

```typescript
// Create a like
POST /api/prompts/{promptId}/like
{userId, promptId}

// Delete a like (toggle)
POST /api/prompts/{promptId}/like  (when already liked)

// Get all users who liked a prompt
SELECT * FROM promptLikes WHERE promptId = ?

// Get all prompts a user liked
SELECT * FROM promptLikes WHERE userId = ? 
  JOIN prompts ON promptLikes.promptId = prompts.id
```

### Important Notes

- **Unique Constraint:** Can't have duplicate likes from same user
- **Reflected in:** `prompts.likes` count is denormalized
- **Cached by:** `['/api/prompts', promptId]`

---

## PromptFavorite Object

### What It Does

Bookmarks - separate from likes for different semantics.

### Database Schema

```typescript
export const promptFavorites = pgTable("prompt_favorites", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  promptId: char("prompt_id", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFavorite: unique().on(table.userId, table.promptId),
}));
```

### Operations

```typescript
// Add to favorites
POST /api/prompts/{promptId}/favorite

// Get user's favorites
GET /api/user/favorites

// Remove from favorites (toggle)
POST /api/prompts/{promptId}/favorite  (when already favorited)
```

---

## PromptRating Object

### What It Does

User ratings and reviews of prompts.

### Database Schema

```typescript
export const promptRatings = pgTable("prompt_ratings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  promptId: char("prompt_id", { length: 10 }).notNull(),
  rating: integer("rating").notNull(),      // 1-5
  review: text("review"),                   // Optional review text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Operations

```typescript
// Submit/update rating
POST /api/prompts/{promptId}/rate
{
  rating: 1-5,
  review?: "This prompt was amazing!"
}

// Get all ratings for a prompt
SELECT * FROM promptRatings WHERE promptId = ?

// Average rating for a prompt
SELECT AVG(rating) as averageRating FROM promptRatings WHERE promptId = ?
```

---

## Collection Object

### Purpose

Group related prompts together (like playlists for music).

### Database Schema

```typescript
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id"),                // Owner (if personal)
  communityId: varchar("community_id"),      // Owner (if community)
  type: varchar("type", {
    enum: ["user", "community", "global"]
  }).notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Junction Table (Prompts to Collections)

```typescript
export const promptsToCollections = pgTable("prompts_to_collections", {
  promptId: char("prompt_id", {length: 10}).references(() => prompts.id),
  collectionId: varchar("collection_id").references(() => collections.id),
});
```

### Operations

```typescript
// Create collection
POST /api/collections
{name, description, type: "user", isPublic: false}

// Add prompts to collection
POST /api/prompts/bulk-add-to-collection
{promptIds: [id1, id2], collectionId}

// Get collection with prompts
GET /api/collections/{collectionId}

// Remove prompt from collection
DELETE /api/collections/{collectionId}/prompts/{promptId}

// Delete collection (cascades to junction table)
DELETE /api/collections/{collectionId}
```

### Important Relationship

A prompt can belong to **multiple collections**. The junction table enables this many-to-many relationship.

---

## PromptCommunitySharing Object

### Purpose

Share a prompt with specific communities (different from `isPublic`).

### Database Schema

```typescript
export const promptCommunitySharing = pgTable("prompt_community_sharing", {
  promptId: char("prompt_id", { length: 10 }).references(() => prompts.id),
  communityId: varchar("community_id").references(() => communities.id),
  sharedBy: varchar("shared_by").references(() => users.id),
  sharedAt: timestamp("shared_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.promptId, table.communityId] }),
  // Composite key ensures one sharing per community
]);
```

### Operations

```typescript
// Share prompt with communities
POST /api/prompts/{promptId}/visibility
{
  isPublic: true,  // Makes globally public
  communityIds: [id1, id2]  // OR share with specific communities
}

// Get communities a prompt is shared with
GET /api/prompts/{promptId}/communities

// Remove from community
DELETE entries from promptCommunitySharing
```

### Important Logic

```typescript
// A prompt is "public" if:
isPublic === true  // OR
// It's shared with a public community
```

---

## Community Object

### Database Schema (Abbreviated)

```typescript
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  
  // Hierarchy for sub-communities
  parentCommunityId: varchar("parent_community_id"),
  level: integer("level"),        // 0 for top-level
  path: text("path"),             // Materialized path
  
  createdBy: varchar("created_by"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

### Community Types

- **Global Community** (no `parentCommunityId`) - Public space for all users
- **Private Community** (has `parentCommunityId`) - Private space for members
- **Sub-Community** - Community within a community

### Membership

```typescript
// User membership tracked in:
export const userCommunities = pgTable("user_communities", {
  userId: varchar("user_id"),
  communityId: varchar("community_id"),
  subCommunityId: varchar("sub_community_id"),
  role: "member" | "admin",
  status: "pending" | "accepted" | "rejected",
  joinedAt: timestamp("joined_at"),
  respondedAt: timestamp("responded_at"),
});
```

---

## User Object

### Core Fields

```typescript
export const users = pgTable("users", {
  // Identity
  id: varchar("id").primaryKey(),           // UUID from Replit Auth
  email: varchar("email").unique(),
  username: varchar("username").unique(),   // Display name
  
  // Profile
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  website: varchar("website"),
  
  // Social media handles
  twitterHandle: varchar("twitter_handle"),
  githubHandle: varchar("github_handle"),
  // ... more social handles
  
  // Role
  role: "user" | "community_admin" | "sub_community_admin" | "super_admin" | "global_admin" | "developer",
  
  // Privacy
  profileVisibility: "public" | "private",
  emailVisibility: boolean,
  showStats: boolean,
  showBirthday: boolean,
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

---

## Data Validation Rules

### Prompt Creation

```typescript
✅ REQUIRED:
  - name: non-empty string
  - promptContent: non-empty string
  - userId: valid UUID (from auth)

⚠️ VALIDATED IF PROVIDED:
  - tags: array of strings, max 20
  - categories: array from predefined list
  - isPublic: boolean
  - status: one of enum values
  
❌ IGNORED ON CREATE:
  - id (generated by backend)
  - createdAt (set by backend)
  - likes (starts at 0)
  - usageCount (starts at 0)
```

### Like/Favorite Operations

```typescript
✅ REQUIRED:
  - userId: authenticated user
  - promptId: valid prompt ID

⚠️ CONSTRAINTS:
  - One like per user per prompt (unique constraint)
  - One favorite per user per prompt (unique constraint)
  - Prompt must exist
  - User must be authenticated
```

### Community Sharing

```typescript
✅ REQUIRED:
  - promptId: valid prompt ID
  - communityIds: array of valid community IDs
  - authenticated user (owner of prompt)

⚠️ LOGIC:
  - If any community is public → isPublic = true
  - If all communities are private → isPublic = false
  - Cannot share with community you're not a member of (admin only)
```

---

## Cache Invalidation Triggers

### These Operations Invalidate `/api/prompts` (All Prompts)

- Creating a new prompt
- Deleting a prompt
- Changing isPublic status
- Featuring/unfeaturing a prompt

### These Operations Invalidate `/api/prompts/{id}` (Single Prompt)

- Updating any prompt field
- Liking/unliking
- Favoriting/unfavoriting
- Rating
- Adding to collection

### These Operations Invalidate `/api/collections/{id}`

- Adding prompts to collection
- Removing prompts from collection
- Changing collection visibility

### These Operations Invalidate `/api/user/*`

- Liking a prompt → invalidate `/api/user/likes`
- Favoriting → invalidate `/api/user/favorites`
- Creating prompt → invalidate user's prompts list

---

## Migration Safe Practices

### ✅ Safe Changes

- Adding optional fields to Prompt
- Changing UI/display of data
- Modifying frontend validation
- Reorganizing metadata

### ⚠️ Risky Changes

- Changing `id` format
- Removing `promptContent` field
- Changing `userId` relationship
- Altering unique constraints

### ❌ Breaking Changes

- Deleting core tables without migration
- Changing enum values without migration scripts
- Renaming primary key fields
- Removing foreign key constraints

---

## Common Patterns

### Pattern 1: Get All Public Prompts

```typescript
GET /api/prompts?isPublic=true&limit=20&offset=0

// Filters:
?isPublic=true         // Only public
?category=Art          // Specific category
?tags=landscape        // Any tag match
?search=mountain       // Text search
?isFeatured=true       // Featured only
?sort=createdAt        // Sort by field
```

### Pattern 2: Get User's Prompts

```typescript
GET /api/prompts?userId={userId}

// Returns all prompts owned by this user
// Requires authentication if requesting own
// Public version if requesting others
```

### Pattern 3: Interact with Prompt

```typescript
// Like
POST /api/prompts/{id}/like

// Favorite
POST /api/prompts/{id}/favorite

// Rate
POST /api/prompts/{id}/rate
{rating: 5, review: "Amazing!"}

// Share
POST /api/prompts/{id}/visibility
{communityIds: [comm1, comm2]}
```

### Pattern 4: Manage Collections

```typescript
// Create
POST /api/collections
{name: "My Favorites", type: "user", isPublic: false}

// Add prompts
POST /api/prompts/bulk-add-to-collection
{promptIds: [p1, p2, p3], collectionId}

// Get collection contents
GET /api/collections/{id}
```

---

## Debugging Checklist

When things go wrong, verify:

- [ ] User is authenticated (`userId` is valid)
- [ ] Prompt exists (check `id` format - should be 10 chars)
- [ ] User owns the prompt (check `userId` match)
- [ ] Prompt is visible to user (`isPublic` or in their community)
- [ ] Cache is invalidated (TanStack Query keys match)
- [ ] Required fields are provided (name, promptContent)
- [ ] Unique constraints not violated (like, favorite, rating)
- [ ] Foreign keys exist (valid userId, communityId, etc.)

---

## Quick Copy-Paste: Creating a Prompt

### Frontend

```typescript
const { mutate: createPrompt } = useMutation({
  mutationFn: async (data: InsertPrompt) => 
    apiRequest('/api/prompts', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['/api/prompts']
    });
    showSuccessToast('Prompt created!');
  },
  onError: () => {
    showErrorToast('Failed to create prompt');
  }
});

// Use it
createPrompt({
  name: "My Prompt",
  promptContent: "A detailed prompt...",
  isPublic: true,
  tags: ["art", "design"]
});
```

### Backend Response

```json
{
  "id": "abc1234567",
  "name": "My Prompt",
  "promptContent": "A detailed prompt...",
  "userId": "user-uuid",
  "isPublic": true,
  "tags": ["art", "design"],
  "likes": 0,
  "usageCount": 0,
  "status": "published",
  "createdAt": "2024-12-19T10:30:00Z",
  "updatedAt": "2024-12-19T10:30:00Z"
}
```

---

This reference should help you understand exactly what data exists and how it flows through the system during your redesign.
