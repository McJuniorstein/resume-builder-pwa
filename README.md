# R&D Resume Builder PWA

A mobile-first Progressive Web App for building ATS-optimized resumes. Works offline, installs like a native app, and exports to Word/PDF formats.

## Features

### Core Resume Builder
- **Section-based editing**: Contact info, summary, experience, education, skills, certifications, clearances, and references
- **Live preview**: See your resume as you build it
- **Word export**: Generate `.docx` files optimized for ATS systems
- **PDF export**: Print-ready PDF via browser print dialog
- **JSON backup**: Import/export resume data for backup

### PWA Capabilities
- **Offline mode**: Full functionality without internet via service worker
- **Installable**: Add to home screen on mobile or desktop
- **Splash screen**: Native app-like loading experience
- **Auto-update**: New versions deploy automatically

### Cover Letter Companion
- **Template-based generation**: Professional, enthusiastic, and concise templates
- **Job-specific**: Customized for company, role, and job description
- **Save/load**: Store multiple cover letters locally

### ATS Keyword Analyzer
- **Keyword extraction**: Analyzes job descriptions for important terms
- **Match scoring**: Shows percentage of keywords found in your resume
- **Gap analysis**: Highlights missing keywords to add

### Auto-Suggestions
- **Learning input fields**: Remembers companies, job titles, schools, and degrees
- **Quick entry**: Previously entered values appear as suggestions

### Cloud Backup
- **File System Access API**: Save/open files directly to cloud folders (Google Drive, Dropbox, iCloud)
- **Cross-device sync**: Keep resumes synced via cloud storage

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd resume_builder_pwa
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **vite-plugin-pwa** - PWA generation with Workbox
- **docx** - Word document generation

## Project Structure

```
resume_builder_pwa/
├── public/
│   ├── icon.svg           # App icon (SVG)
│   ├── favicon.ico        # Browser favicon
│   ├── pwa-192x192.png    # PWA icon (small)
│   ├── pwa-512x512.png    # PWA icon (large)
│   └── apple-touch-icon.png
├── src/
│   ├── App.jsx            # Main application
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML template with splash screen
├── vite.config.js         # Vite + PWA configuration
└── package.json
```

## Future Upgrades

The following features are planned for future releases:

### Resume Management
- [ ] **Multiple resume profiles** - Save different versions for different job types
- [ ] **Resume templates/themes** - Modern, classic, minimal, creative designs
- [ ] **Drag-to-reorder sections** - Customize section order via drag and drop

### Content Enhancement
- [ ] **Bullet point enhancer** - AI-powered suggestions for stronger action verbs
- [ ] **LinkedIn PDF import** - Parse LinkedIn profile exports automatically
- [ ] **Voice input** - Dictate resume content on mobile devices

### User Experience
- [ ] **Dark/light mode toggle** - Theme switching for user preference
- [ ] **Keyboard shortcuts** - Power user navigation (Ctrl+S, Ctrl+P, etc.)
- [ ] **Undo/redo history** - Step backward/forward through changes
- [ ] **Guided wizard mode** - Step-by-step resume building for beginners

### Sharing & Tracking
- [ ] **QR code generator** - Quick link to hosted resume
- [ ] **Job application tracker** - Log applications, interviews, and outcomes
- [ ] **Resume analytics** - Track views if hosted online

### Advanced Features
- [ ] **Real-time collaboration** - Share and co-edit with reviewers
- [ ] **Version history** - View and restore previous versions
- [ ] **Resume scoring** - AI analysis of resume strength
- [ ] **Industry-specific templates** - Tech, healthcare, finance, etc.

## Storage

All data is stored locally in the browser:

| Key | Purpose |
|-----|---------|
| `rd_resume_builder_data` | Resume content |
| `rd_resume_device_files` | Simulated device storage (testing) |
| `rd_resume_cover_letters` | Saved cover letters |
| `rd_resume_suggestions` | Auto-complete suggestions |
| `rd_resume_install_dismissed` | Install banner state |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with Claude Code
