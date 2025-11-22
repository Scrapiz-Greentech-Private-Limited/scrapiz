# Google Meet Integration - Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native)                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Booking Form (book.tsx)                                  │  │
│  │  - Service selection                                      │  │
│  │  - Contact details                                        │  │
│  │  - Date/Time picker                                       │  │
│  │  - Address input                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ POST /api/services/bookings/        │
│                            ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │
┌─────────────────────────────────────────────────────────────────┐
│                      DJANGO BACKEND                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ServiceBookingAPIView (views.py)                         │  │
│  │  1. Validate booking data                                 │  │
│  │  2. Create booking record                                 │  │
│  │  3. Call GoogleMeetService                                │  │
│  │  4. Call EmailService                                     │  │
│  │  5. Return response                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                    │                    │            │
│           │                    │                    │            │
│           ▼                    ▼                    ▼            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │  Database    │   │  Google Meet │   │  Email       │       │
│  │  (Postgres)  │   │  Service     │   │  Service     │       │
│  │              │   │              │   │              │       │
│  │  - Save      │   │  - Create    │   │  - Send      │       │
│  │    booking   │   │    calendar  │   │    HTML      │       │
│  │  - Store     │   │    event     │   │    email     │       │
│  │    meeting   │   │  - Generate  │   │  - Include   │       │
│  │    link      │   │    Meet link │   │    details   │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
│                             │                    │               │
└─────────────────────────────────────────────────────────────────┘
                              │                    │
                              ▼                    ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │  Google Calendar │  │  User Email      │
                    │  - Event created │  │  - Confirmation  │
                    │  - Meet attached │  │  - Meet link     │
                    │  - User invited  │  │  - Calendar inv  │
                    └──────────────────┘  └──────────────────┘
```

---

## Booking Flow Sequence

```
User                Client              Backend             Google API          Email Service
 │                    │                    │                    │                    │
 │  Fill form         │                    │                    │                    │
 │───────────────────>│                    │                    │                    │
 │                    │                    │                    │                    │
 │  Submit booking    │                    │                    │                    │
 │───────────────────>│                    │                    │                    │
 │                    │                    │                    │                    │
 │                    │  POST /bookings/   │                    │                    │
 │                    │───────────────────>│                    │                    │
 │                    │                    │                    │                    │
 │                    │                    │  Validate data     │                    │
 │                    │                    │──────────┐         │                    │
 │                    │                    │          │         │                    │
 │                    │                    │<─────────┘         │                    │
 │                    │                    │                    │                    │
 │                    │                    │  Save to DB        │                    │
 │                    │                    │──────────┐         │                    │
 │                    │                    │          │         │                    │
 │                    │                    │<─────────┘         │                    │
 │                    │                    │                    │                    │
 │                    │                    │  Create meeting    │                    │
 │                    │                    │───────────────────>│                    │
 │                    │                    │                    │                    │
 │                    │                    │                    │  Generate link     │
 │                    │                    │                    │──────────┐         │
 │                    │                    │                    │          │         │
 │                    │                    │                    │<─────────┘         │
 │                    │                    │                    │                    │
 │                    │                    │  Meeting details   │                    │
 │                    │                    │<───────────────────│                    │
 │                    │                    │                    │                    │
 │                    │                    │  Update DB         │                    │
 │                    │                    │──────────┐         │                    │
 │                    │                    │          │         │                    │
 │                    │                    │<─────────┘         │                    │
 │                    │                    │                    │                    │
 │                    │                    │  Send email        │                    │
 │                    │                    │───────────────────────────────────────>│
 │                    │                    │                    │                    │
 │                    │                    │                    │                    │  Send
 │                    │                    │                    │                    │──────>
 │                    │                    │                    │                    │
 │                    │                    │  Email sent        │                    │
 │                    │                    │<───────────────────────────────────────│
 │                    │                    │                    │                    │
 │                    │  Success response  │                    │                    │
 │                    │<───────────────────│                    │                    │
 │                    │                    │                    │                    │
 │  Success message   │                    │                    │                    │
 │<───────────────────│                    │                    │                    │
 │                    │                    │                    │                    │
 │  (3 sec delay)     │                    │                    │                    │
 │                    │                    │                    │                    │
 │  Redirect          │                    │                    │                    │
 │<───────────────────│                    │                    │                    │
 │                    │                    │                    │                    │
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        INPUT DATA                                │
├─────────────────────────────────────────────────────────────────┤
│  {                                                               │
│    service: "AC Repair",                                        │
│    name: "John Doe",                                            │
│    phone: "+919876543210",                                      │
│    address: "123 Main St, Mumbai",                             │
│    preferred_datetime: "2024-01-15T10:00:00Z",                 │
│    notes: "Please call before arriving"                        │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING STEPS                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Validate input data                                         │
│  2. Create ServiceBooking record                                │
│  3. Generate Google Meet link                                   │
│  4. Update booking with meeting details                         │
│  5. Send confirmation email                                     │
│  6. Return response to client                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       OUTPUT DATA                                │
├─────────────────────────────────────────────────────────────────┤
│  {                                                               │
│    message: "Service booking submitted successfully",           │
│    booking: {                                                    │
│      id: 123,                                                    │
│      service: "AC Repair",                                      │
│      name: "John Doe",                                          │
│      phone: "+919876543210",                                    │
│      address: "123 Main St, Mumbai",                           │
│      preferred_datetime: "2024-01-15T10:00:00Z",               │
│      notes: "Please call before arriving",                     │
│      status: "pending",                                         │
│      meeting_link: "https://meet.google.com/abc-defg-hij",     │
│      meeting_event_id: "event123abc",                          │
│      created_at: "2024-01-10T08:30:00Z"                        │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Booking Submission                            │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Validate Data │
                    └────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 Valid?              Invalid
                    │                 │
                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐
            │  Create      │   │  Return      │
            │  Booking     │   │  Error 400   │
            └──────────────┘   └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Try Create  │
            │  Meeting     │
            └──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Success                   Failure
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Save        │        │  Log Error   │
│  Meeting     │        │  Continue    │
│  Link        │        │  Without     │
└──────────────┘        │  Meeting     │
        │               └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Try Send    │
            │  Email       │
            └──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Success                   Failure
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Email Sent  │        │  Log Error   │
│              │        │  Continue    │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Return      │
            │  Success     │
            │  Response    │
            └──────────────┘
```

**Key Point**: Booking ALWAYS succeeds even if meeting creation or email fails!

---

## Component Interaction

```
┌────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  book.tsx    │                                               │
│  │              │                                               │
│  │  - Form UI   │                                               │
│  │  - Validation│                                               │
│  │  - Submit    │                                               │
│  │  - Success   │                                               │
│  │  - Redirect  │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         │ Uses                                                   │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ apiService.ts│                                               │
│  │              │                                               │
│  │  - HTTP      │                                               │
│  │  - Auth      │                                               │
│  │  - Types     │                                               │
│  └──────────────┘                                               │
└────────────────────────────────────────────────────────────────┘
         │
         │ HTTP POST
         ▼
┌────────────────────────────────────────────────────────────────┐
│                         Backend                                 │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  views.py    │─────>│  models.py   │      │serializers.py│ │
│  │              │      │              │      │              │ │
│  │  - Endpoint  │      │  - Database  │      │  - Validate  │ │
│  │  - Logic     │      │  - Fields    │      │  - Serialize │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                                                        │
│         │ Calls                                                  │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │meeting_      │                                               │
│  │service.py    │                                               │
│  │              │                                               │
│  │  - Calendar  │                                               │
│  │  - Meet link │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         │ Calls                                                  │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │email_        │                                               │
│  │service.py    │                                               │
│  │              │                                               │
│  │  - HTML      │                                               │
│  │  - Send      │                                               │
│  └──────────────┘                                               │
└────────────────────────────────────────────────────────────────┘
         │                    │
         │                    │
         ▼                    ▼
┌──────────────┐      ┌──────────────┐
│  Google      │      │  SMTP        │
│  Calendar    │      │  Server      │
│  API         │      │  (Gmail)     │
└──────────────┘      └──────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    ServiceBooking Table                          │
├─────────────────────────────────────────────────────────────────┤
│  id                  INTEGER PRIMARY KEY                         │
│  user_id             INTEGER FOREIGN KEY → User.id              │
│  service             VARCHAR(100)                                │
│  name                VARCHAR(100)                                │
│  phone               VARCHAR(20)                                 │
│  address             TEXT                                        │
│  preferred_datetime  VARCHAR(120)                                │
│  notes               TEXT (nullable)                             │
│  status              VARCHAR(20) DEFAULT 'pending'               │
│  meeting_link        VARCHAR(200) (nullable) ← NEW              │
│  meeting_event_id    VARCHAR(255) (nullable) ← NEW              │
│  created_at          TIMESTAMP DEFAULT NOW()                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Panel Flow

```
Admin User
    │
    │ Opens browser
    ▼
┌─────────────────────────────────────────┐
│  https://api.scrapiz.in/admin/          │
└─────────────────────────────────────────┘
    │
    │ Navigate to
    ▼
┌─────────────────────────────────────────┐
│  Services > Service Bookings            │
└─────────────────────────────────────────┘
    │
    │ View list
    ▼
┌─────────────────────────────────────────┐
│  Booking List                            │
│  ┌────────────────────────────────────┐ │
│  │ ID | Service | Name | Join Meet   │ │
│  ├────────────────────────────────────┤ │
│  │ 1  | AC      | John | [Join Meet] │ │
│  │ 2  | Fridge  | Jane | [Join Meet] │ │
│  │ 3  | Washing | Bob  | [Join Meet] │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
    │
    │ Click "Join Meet"
    ▼
┌─────────────────────────────────────────┐
│  Google Meet opens in new tab           │
│  https://meet.google.com/abc-defg-hij   │
└─────────────────────────────────────────┘
```

---

## Email Template Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Email Header                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │              🎉 Booking Confirmed!                         │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         Email Body                               │
│                                                                   │
│  Dear John Doe,                                                  │
│                                                                   │
│  Your service booking has been confirmed.                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Service: AC Repair                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Scheduled Time: Jan 15, 2024 at 10:00 AM               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Address: 123 Main St, Mumbai                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Contact: +919876543210                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Join your video inspection meeting:             │   │
│  │                                                           │   │
│  │              [ Join Google Meet ]                        │   │
│  │                                                           │   │
│  │  Or copy: https://meet.google.com/abc-defg-hij         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Our team will contact you shortly to confirm the details.      │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                         Email Footer                             │
│                                                                   │
│  Thank you for choosing Scrapiz!                                │
│  If you have any questions, please contact us.                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Flow (Happy Path)

```
1. User opens app
        ↓
2. Navigates to Services
        ↓
3. Selects "AC Repair"
        ↓
4. Clicks "Book This Service"
        ↓
5. Fills booking form:
   - Name: John Doe
   - Phone: +919876543210
   - Address: 123 Main St
   - Date: Tomorrow
   - Time: 10:00 AM
        ↓
6. Clicks "Confirm Booking"
        ↓
7. Loading indicator shows
        ↓
8. Success screen appears:
   "Booking Confirmed!"
   "Meeting details sent to your email"
        ↓
9. Auto-redirect (3 seconds)
        ↓
10. Back to Services page
        ↓
11. User checks email
        ↓
12. Opens confirmation email
        ↓
13. Sees booking details + Meet link
        ↓
14. Adds to calendar (from invite)
        ↓
15. At scheduled time, joins meeting
        ↓
16. Video inspection completed
        ↓
17. Service delivered ✅
```

---

## Monitoring Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Booking Metrics Dashboard                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Today's Stats:                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Bookings    │  │  Meetings    │  │  Emails      │          │
│  │     45       │  │     43       │  │     44       │          │
│  │   100%       │  │   95.6%      │  │   97.8%      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Recent Bookings:                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Time  │ Service │ User │ Meeting │ Email │ Status     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ 10:30 │ AC      │ John │ ✅      │ ✅    │ Confirmed  │    │
│  │ 10:25 │ Fridge  │ Jane │ ✅      │ ✅    │ Confirmed  │    │
│  │ 10:20 │ Washing │ Bob  │ ❌      │ ✅    │ Confirmed  │    │
│  │ 10:15 │ AC      │ Alice│ ✅      │ ✅    │ Confirmed  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Errors (Last Hour):                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 10:20 - Meeting creation failed: API quota exceeded    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

*These diagrams provide a visual understanding of the Google Meet integration system.*
