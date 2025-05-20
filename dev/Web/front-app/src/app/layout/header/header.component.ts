import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  isDarkMode = false;
  showWorkspaceMenu = false;
  apiIconHovered = false;

  ngOnInit() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';

    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';

    // Save to localStorage
    localStorage.setItem('theme', newTheme);

    this.applyTheme();
  }

  private applyTheme() {
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-theme');
      window.dispatchEvent(new CustomEvent('themeChange', { detail: 'vs-dark' }));
    } else {
      body.classList.remove('dark-theme');
      window.dispatchEvent(new CustomEvent('themeChange', { detail: 'vs-light' }));
    }
  }
}
