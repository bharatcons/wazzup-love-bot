# WhatsApp Reminder Manager

A modern web application for scheduling and managing automated WhatsApp reminders, with special support for Indian phone numbers.

## Key Features

### 📱 WhatsApp Integration
- Create reminders that automatically open WhatsApp at scheduled times
- Pre-filled messages for quick sending
- Enhanced support for Indian phone numbers (auto-detection and formatting)
- Direct WhatsApp opening with proper country code handling

### ⏰ Flexible Scheduling
- Set reminders to repeat daily, weekly, monthly, or as one-time events
- Choose specific days of the week for weekly reminders
- Select specific days of the month for monthly reminders
- Set precise times for all reminders

### 👥 Contact Management
- Store and organize your contacts
- Tag contacts for easy filtering
- Recent contacts feature for quick access

### 📝 Message Templates
- Create and save reusable message templates
- Organize templates with tags
- Quickly apply templates to new reminders

### 📊 Analytics Dashboard
- Track your messaging patterns
- View statistics on reminder frequency and usage

### 📆 Calendar View
- See your reminders in a monthly calendar layout
- Quickly identify busy days and scheduling patterns

### 🔄 Backup & Restore
- Export your reminders, contacts, and templates
- Restore from backup files
- Ensure your data is always safe

### 🚀 Quick Send
- Send WhatsApp messages without creating reminders
- Access your contacts and templates quickly
- Perfect for one-off communications
- Maintains history of recently used contacts

### 📣 Status Manager
- Create and organize WhatsApp status updates
- Categorize statuses for easy access
- Add emoji to make your statuses stand out
- Mark favorite statuses for quick access
- Copy to clipboard and open WhatsApp status page

### 🖼️ Sticker Creator
- Create and manage custom stickers for WhatsApp
- Upload your own images as stickers
- Organize stickers by category
- Mark favorite stickers for quick access
- Easily share stickers via WhatsApp

### 🇮🇳 Indian Phone Number Support
- Automatic detection of Indian mobile numbers
- Proper formatting with country code (+91)
- Validation for Indian number formats (10 digits starting with 6-9)
- Direct opening in WhatsApp with correct formatting

## Automatic Reminder Triggering

Reminders are automatically checked and triggered based on their scheduled times:

1. **Real-time Checking**: The application continuously checks for due reminders every minute
2. **Browser Notifications**: Desktop notifications alert you when it's time to send a message
3. **Sound Alerts**: Audio cues for due reminders
4. **Auto-Open**: Option to automatically open WhatsApp with the message ready to send
5. **Last Triggered Tracking**: The system tracks when reminders were last triggered to prevent duplicates

## Technical Details

- Built with React, TypeScript, and Vite
- Uses Supabase for real-time database and authentication
- Responsive design for both desktop and mobile devices
- PWA-capable for installation on mobile devices

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your Supabase project and add credentials to `.env`
4. Run the development server with `npm run dev`
5. Build for production with `npm run build`

## Environment Variables

Create a `.env` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

The application requires the following tables in your Supabase database:
- `reminders`: Stores all reminder information
- `contacts`: Stores contact information
- `message_templates`: Stores reusable message templates
- `status_updates`: Stores WhatsApp status updates
- `stickers`: Stores custom WhatsApp stickers

A SQL setup script is provided in `src/scripts/db_setup.sql` to create these tables with the correct schema.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
