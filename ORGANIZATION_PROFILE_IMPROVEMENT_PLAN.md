# 🏢 Organization Profile & Social Feed - Comprehensive Improvement Plan

## 📋 Executive Summary
Transform the organization profile page and social feeds into a LinkedIn-like professional platform where organizations can showcase their impact, share content, and engage with their community.

---

## 🎯 Phase 1: Organization Profile Header Redesign (PRIORITY 1)

### Current Issues:
- ❌ Basic header layout with small logo
- ❌ No banner/cover image
- ❌ Cramped information display
- ❌ Lacks visual hierarchy and impact

### Proposed Solution - **Community-Style Premium Header**:

#### **1. Hero Banner Section** (300px height)
- **Cover Image**: Full-width banner showcasing organization's work
  - Photos from events, team photos, impact locations
  - Fallback: Branded gradient with organization letter/logo pattern
- **Gradient Overlay**: Bottom fade for readability
- **Change Banner Button**: (For org admins only)

#### **2. Profile Card** (Overlapping banner)
- **Large Logo**: 140x140px with gradient glow effect
  - Round or square based on org preference
  - Positioned -80px from bottom of banner (overlapping effect)
- **Organization Name**: Large (text-5xl), bold, prominent
- **Verified Badge**: Blue checkmark for verified organizations
- **Tier Badge**: Prominent tier status (color-coded)

#### **3. Key Stats Row** (Icon + Number + Label format)
```
👥 2,450 Followers  |  📊 15,420 Impact Score  |  ⏰ 12,500 Hours  |  🎯 24 Events  |  📅 Est. 2018
```

#### **4. Quick Info Section**
- **Industry**: Environment & Sustainability
- **Organization Size**: 50-100 employees  
- **Location**: Kuala Lumpur, Malaysia (with map icon)
- **Website**: Clickable link with external icon
- **Contact**: Email & phone (icon buttons)

#### **5. SDG Alignment Badges**
- Visual SDG icons in a row
- Same style as community page
- Colored borders matching SDG colors

#### **6. Action Buttons**
- **Follow/Following**: Prominent gradient button
- **Share Profile**: Share button with copy link
- **Contact**: Send message button
- **Donate**: (If enabled) highlighted button

---

## 🌐 Phase 2: Unified Social Feed System (PRIORITY 1)

### **Problem Statement**:
Currently feeds are siloed - we need ONE unified social feed that shows:
- ✅ User achievements & activity
- ✅ Organization posts & updates  
- ✅ Event announcements
- ✅ Impact stories with photos
- ✅ Shared certificates & badges
- ✅ Community updates

### **Feed Architecture**:

#### **Post Types & Structure**:

1. **Organization Post Types**:
   ```typescript
   {
     type: 'ORGANIZATION_UPDATE',
     author: { type: 'organization', id, name, logo },
     content: string,
     media: {
       images: string[],  // Up to 10 images
       videos: string[],  // Video embeds
       documents: []       // PDF/docs
     },
     metadata: {
       location?: string,
       eventId?: string,   // Link to event
       participantCount?: number,
       impactMetrics?: {
         hoursDonated: number,
         peopleReached: number,
         sdgsImpacted: number[]
       }
     },
     interactions: {
       likes, comments, shares, kudos
     }
   }
   ```

2. **Event-Related Posts**:
   - **Upcoming Event Announcement**: "Join us for Beach Cleanup this Saturday!"
   - **Event Recap**: Photo gallery + stats from completed events
   - **Participant Spotlight**: Featuring outstanding volunteers
   - **Milestone Posts**: "We've reached 10,000 volunteer hours!"

3. **Impact Story Posts**:
   - Before/After photos
   - Community testimonials
   - Progress updates on long-term initiatives
   - SDG impact reports

4. **Achievement Posts** (Organization-level):
   - New badges earned
   - Tier upgrades
   - ESG score milestones
   - Partnership announcements

#### **Feed Components**:

**1. Create Post Section** (Top of feed)
- Organization admins can create posts
- Rich text editor
- Media upload (drag & drop)
- Tag events, SDGs, locations
- Schedule posts option
- Audience selector (Public/Followers/Members)

**2. Post Card Design** (LinkedIn-style):
```
┌─────────────────────────────────────────────────┐
│ [Logo] Organization Name                [...]  │
│        Industry • Location • 2h ago           │
├─────────────────────────────────────────────────┤
│ 🎉 Exciting news! We just completed our...    │
│                                                 │
│ [Photo Gallery - up to 10 images]              │
│ 📸 Show all 8 photos                           │
├─────────────────────────────────────────────────┤
│ 👏 24  💬 12  ↗️ 5  🏆 8                       │
├─────────────────────────────────────────────────┤
│ [Like] [Comment] [Share] [Give Kudos]         │
└─────────────────────────────────────────────────┘
```

**3. Enhanced Interaction Options**:
- **Reactions**: Like, Love, Inspire, Support (custom reaction types)
- **Comments**: Nested replies (up to 3 levels deep)
- **Share Options**:
  - Share to your profile
  - Share to a community
  - Copy link
  - Share via email
- **Kudos System**: Special recognition (counts toward org reputation)
- **Save Post**: Bookmark for later
- **Report/Hide**: Moderation options

**4. Feed Filters**:
- All Activity (default)
- Organizations Only
- Events & Opportunities
- Achievements
- Impact Stories
- Following (personalized)

---

## 📊 Phase 3: Organization Profile Content Sections

### **Tab Structure**:

#### **1. Feed Tab** (Default)
- Organization's posts in chronological order
- Pinned posts feature
- Featured/highlight posts at top
- Load more pagination

#### **2. About Tab**
**What Users Want to Know**:

**Mission & Vision**:
- Our Story (founding story, why we exist)
- Mission Statement
- Vision for Impact
- Core Values

**Impact Metrics** (Visual Dashboard):
```
┌────────────────────────────────────────┐
│  📊 TOTAL IMPACT THIS YEAR             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  12,500 Hours Donated                  │
│  450 Volunteers Engaged                │
│  24 Events Completed                   │
│  15,420 Lives Impacted                 │
│  5 SDGs Addressed                      │
└────────────────────────────────────────┘
```

**Focus Areas & Expertise**:
- Primary SDG Focus (with detailed descriptions)
- Geographic regions of operation
- Beneficiary demographics
- Specialized programs

**Team & Leadership**:
- Leadership team profiles
- Advisory board
- Key team members
- Organizational structure

**Partnerships & Collaborations**:
- Partner organizations (linked)
- Corporate sponsors
- Academic partnerships
- Government affiliations

**Transparency & Accountability**:
- Financial transparency
  - Annual budget breakdown
  - Fund allocation charts
  - Admin vs. program spending ratio
- Annual reports (downloadable)
- ESG reports
- Third-party certifications
- Audit reports

**Contact & Locations**:
- HQ address with map
- Regional offices
- Operating locations (map view)
- Contact form
- Social media links

#### **3. Events Tab**
- **Upcoming Events**: Grid/List view with signup CTAs
- **Past Events**: Photo galleries + impact metrics
- **Event Calendar**: Monthly view
- **Filters**: By SDG, location, date, type

#### **4. Opportunities Tab**
- **Active Volunteer Opportunities**
- **Skills-based opportunities**
- **Virtual opportunities**
- **Filters & Search**

#### **5. Impact Tab**
**Visual Impact Dashboard**:
- **ESG Score Breakdown** (Charts)
- **SDG Impact Map** (Geographic visualization)
- **Year-over-year Growth** (Trend charts)
- **Impact Stories** (Case studies)
- **Testimonials** (From volunteers & beneficiaries)
- **Media Coverage** (Press mentions)

#### **6. Team Tab**
- **Active Members** (with roles)
- **Top Contributors** (Leaderboard)
- **Volunteer Testimonials**
- **Join Our Team** (CTA for recruitment)

#### **7. Certificates Tab**
- **Issued Certificates** (Grid view)
- **Verification System** (QR codes)
- **Filter by volunteer, event, date**

---

## 🎨 Phase 4: Visual Design Enhancements

### **Design System Principles**:

1. **Visual Hierarchy**:
   - Large, impactful headlines
   - Generous whitespace
   - Clear content sections
   - Sticky navigation for tabs

2. **Color System**:
   - Brand colors for organization identity
   - SDG colors for impact alignment
   - Tier-based gradient badges
   - Dark mode fully supported

3. **Typography**:
   - Headlines: Bold, large (text-4xl to text-6xl)
   - Body: Comfortable reading (text-base, line-height-relaxed)
   - Stats: Extra bold, large numbers

4. **Cards & Components**:
   - Elevated shadows on hover
   - Smooth transitions
   - Rounded corners (consistent)
   - Border highlights for interactive elements

5. **Images & Media**:
   - High-quality, optimized images
   - Lazy loading
   - Lightbox for galleries
   - Skeleton loaders during fetch

---

## 🔧 Phase 5: Technical Implementation

### **Database Schema Updates**:

#### **OrganizationPost Model**:
```prisma
model OrganizationPost {
  id              String   @id @default(cuid())
  organizationId  String
  authorId        String   // User who posted (org admin)
  content         String   @db.Text
  postType        PostType // UPDATE, EVENT_ANNOUNCE, EVENT_RECAP, IMPACT_STORY, ACHIEVEMENT
  
  // Media
  images          String[] // Array of image URLs
  videos          String[] // Video URLs/embeds
  documents       Json?    // Document attachments
  
  // Metadata
  eventId         String?
  location        String?
  sdgs            Int[]
  tags            String[]
  
  // Impact Metrics
  hoursReported   Float?
  peopleReached   Int?
  volunteersCount Int?
  
  // Interactions
  likes           Int @default(0)
  shares          Int @default(0)
  kudos           Int @default(0)
  
  // Settings
  visibility      Visibility // PUBLIC, FOLLOWERS, MEMBERS
  isPinned        Boolean @default(false)
  scheduledFor    DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId])
  author          User @relation(fields: [authorId])
  event           Event? @relation(fields: [eventId])
  comments        Comment[]
  reactions       Reaction[]
}

enum PostType {
  UPDATE
  EVENT_ANNOUNCE
  EVENT_RECAP
  IMPACT_STORY
  ACHIEVEMENT
  MILESTONE
  PARTNERSHIP
}

enum Visibility {
  PUBLIC
  FOLLOWERS
  MEMBERS
  PRIVATE
}
```

#### **Unified Feed Query**:
```typescript
// Fetch mixed feed (users + organizations)
const feed = await prisma.$queryRaw`
  SELECT * FROM (
    -- User achievement posts
    SELECT id, 'user_achievement' as type, userId as authorId, ... 
    FROM user_achievements
    
    UNION ALL
    
    -- Organization posts
    SELECT id, 'org_post' as type, organizationId as authorId, ...
    FROM organization_posts
    
    UNION ALL
    
    -- Community posts
    SELECT id, 'community_post' as type, communityId as authorId, ...
    FROM community_posts
  ) as unified_feed
  ORDER BY createdAt DESC
  LIMIT 20
`;
```

### **API Endpoints Required**:

```
POST   /api/organizations/posts              // Create post
GET    /api/organizations/posts              // List posts
GET    /api/organizations/[id]/posts         // Org-specific posts
PUT    /api/organizations/posts/[id]         // Edit post
DELETE /api/organizations/posts/[id]         // Delete post

POST   /api/posts/[id]/react                 // Add reaction
POST   /api/posts/[id]/comment               // Add comment
POST   /api/posts/[id]/share                 // Share post
POST   /api/posts/[id]/kudos                 // Give kudos

GET    /api/feed/unified                     // Unified social feed
GET    /api/feed/following                   // Personalized feed
GET    /api/feed/organizations               // Organizations only
GET    /api/feed/achievements                // Achievements only
```

---

## 📈 Phase 6: Features Better Than LinkedIn

### **What Makes Us Special**:

1. **Impact-First Design**:
   - Every post can show measurable impact
   - SDG tagging built-in
   - Visual impact metrics on every event
   - Impact Score prominently displayed

2. **Gamification Elements**:
   - Kudos system (like LinkedIn endorsements but better)
   - Organization tier progression
   - Impact leaderboards
   - Achievement badges

3. **Verification & Trust**:
   - Verified organizations (blue check)
   - Third-party impact verification
   - Transparent financials
   - Volunteer reviews & ratings

4. **Rich Media**:
   - Photo galleries (up to 10 per post)
   - Video embeds
   - Before/After sliders
   - Interactive impact maps

5. **Community Integration**:
   - Cross-posting to communities
   - Event integration
   - Opportunity discovery
   - Certificate issuance

6. **Discovery Features**:
   - **"Organizations Near You"**: Location-based
   - **"Similar Organizations"**: Based on SDGs & industry
   - **"Trending Organizations"**: Based on recent impact
   - **"Most Active"**: Based on engagement

7. **Analytics for Organizations**:
   - Post performance metrics
   - Follower demographics
   - Engagement trends
   - Impact reach analytics

---

## 🎯 Implementation Priority

### **Phase 1 (Week 1)**: Profile Header Redesign ⭐ URGENT
- [ ] Add banner image upload functionality
- [ ] Redesign organization header (community-style)
- [ ] Large logo with gradient glow
- [ ] Enhanced stats display
- [ ] SDG badges integration

### **Phase 2 (Week 2)**: Post Creation System
- [ ] Database schema for OrganizationPost
- [ ] Create post API endpoints
- [ ] Rich text editor component
- [ ] Media upload functionality
- [ ] Post card component

### **Phase 3 (Week 3)**: Unified Feed
- [ ] Unified feed API endpoint
- [ ] Feed filtering system
- [ ] Post interactions (like, comment, share)
- [ ] Kudos system
- [ ] Feed on dashboard page
- [ ] Feed on organization profile page

### **Phase 4 (Week 4)**: Enhanced About Section
- [ ] Mission/Vision editor
- [ ] Impact metrics dashboard
- [ ] Team management
- [ ] Partnership section
- [ ] Transparency reports

### **Phase 5 (Week 5)**: Advanced Features
- [ ] Photo gallery lightbox
- [ ] Video embed support
- [ ] Scheduled posts
- [ ] Post analytics
- [ ] Discovery features

---

## 🎨 UI/UX Mockup Reference

### **Organization Header - Visual Description**:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [  FULL-WIDTH BANNER IMAGE - 300px height   ]                │
│  [Photo of volunteers at event / branded image]               │
│                                                                 │
│        ┌────────────┐  ← Logo (140x140)                       │
└────────│            │────────────────────────────────────────┘
         │   [LOGO]   │  with gradient glow
         │            │
         └────────────┘

┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Green Earth Foundation  ✓ Verified        [Follow] [Share]   │
│  Environmental Conservation                                    │
│  📍 Kuala Lumpur, Malaysia                                    │
│                                                                 │
│  We're dedicated to environmental conservation and            │
│  sustainable practices across Southeast Asia...                │
│                                                                 │
│  🌐 greenearthfoundation.org  ✉️ contact@...  📞 +60...      │
│                                                                 │
│  ┏━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┓  │
│  ┃  👥 2,450    ┃  📊 15,420   ┃  ⏰ 12,500   ┃  🎯 24      ┃  │
│  ┃  Followers   ┃  Impact Score┃  Hours      ┃  Events     ┃  │
│  ┗━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┛  │
│                                                                 │
│  🎯 SDG FOCUS: [13] [14] [15] ← Colorful SDG badges          │
│                                                                 │
│  🏆 Tier: ESG Champion  •  Est. 2018  •  50-100 employees    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 💡 Additional Suggestions

### **Features Users Would Love**:

1. **"Request Partnership"**: Button for other orgs to reach out
2. **"Volunteer Spotlight"**: Monthly featured volunteers
3. **"Impact Calculator"**: Show "Your contributions helped plant 500 trees"
4. **"Event Recap Videos"**: Auto-generated from photos
5. **"Donation Tracking"**: Show how funds are being used
6. **"Impact Newsletter"**: Auto-generated monthly summary
7. **"Organization Comparison"**: Compare impact metrics
8. **"Join Waiting List"**: For popular events
9. **"Skills Needed"**: Show what skills org is looking for
10. **"Language Support"**: Multi-language profiles

### **Trust & Safety**:
- Verified badge system
- Report inappropriate content
- Moderation tools for org admins
- Privacy controls
- Data export

---

## 🚀 Success Metrics

### **Key Performance Indicators**:
- Organization profile views
- Follower growth rate
- Post engagement rate (likes, comments, shares)
- Event signup conversion
- Time spent on profile
- Post reach (impressions)
- Kudos given/received
- Certificate issuance rate

---

## ✅ Conclusion

This transformation will make the platform:
1. ✅ **More engaging** than LinkedIn for social impact
2. ✅ **More transparent** with built-in accountability
3. ✅ **More actionable** with direct paths to volunteer
4. ✅ **More visual** with rich media support
5. ✅ **More impactful** with measurable outcomes

**Let's build something that makes users EXCITED to check their feed every day!** 🎉

