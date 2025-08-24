# ☁️ Productive Cloud

A comprehensive productivity application with habit tracking, project CRM, and Google Drive synchronization.

## ✨ Features

- **🎯 Habit Tracker**: Build and track daily habits with progress visualization
- **🏢 Project CRM**: Manage projects, track time, and organize tasks
- **☁️ Google Drive Sync**: Automatic online backup and cross-device synchronization
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🌙 Dark/Light Theme**: Customizable interface themes
- **💾 Local Storage**: Data persistence using browser storage

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google account for Drive synchronization

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ProductiveCloud.git
   cd ProductiveCloud
   ```

2. Open `index.html` in your browser

3. For Google Drive sync, follow the setup guide in `GOOGLE_SETUP_GUIDE.md`

## 📁 Project Structure

```
ProductiveCloud/
├── index.html          # Main application
├── crm.html           # Project CRM module
├── google-sync-panel.html  # Google Drive sync interface
├── script.js          # Main application logic
├── crm-script.js      # CRM module logic
├── styles.css         # Main application styles
├── crm-styles.css     # CRM module styles
├── google-sync.js     # Google Drive integration
├── GOOGLE_SETUP_GUIDE.md  # Google API setup instructions
└── README.md          # This file
```

## 🔧 Google Drive Sync Setup

To enable automatic online backup and cross-device synchronization:

1. Follow the detailed setup guide in `GOOGLE_SETUP_GUIDE.md`
2. Create a Google Cloud Project
3. Enable Google Drive API
4. Configure OAuth credentials
5. Update API keys in `google-sync.js`

## 🎨 Customization

- **Themes**: Switch between light and dark themes
- **Habits**: Add, edit, and track custom habits
- **Projects**: Create and manage projects with custom fields
- **Sync**: Configure automatic backup intervals

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Drive API for cloud synchronization
- Modern CSS for responsive design
- Local Storage API for data persistence

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the setup guide for common problems
- Review browser console for error messages

---

**Made with ❤️ for productivity enthusiasts**
