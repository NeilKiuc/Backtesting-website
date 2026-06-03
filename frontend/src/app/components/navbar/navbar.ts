import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { AuthService, UserInfo } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
    MatBadgeModule, MatTooltipModule, DatePipe,
    RouterLink, RouterOutlet,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private breakpoints = inject(BreakpointObserver);
  notifService = inject(NotificationService);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  user = signal<UserInfo | null>(null);
  isDemo = signal(false);
  isMobile = signal(false);

  ngOnInit() {
    this.auth.demo$.subscribe((d) => this.isDemo.set(d));
    this.auth.user$.subscribe((u) => this.user.set(u));
    this.breakpoints.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => this.isMobile.set(result.matches));
  }

  closeSidenavIfMobile() {
    if (this.isMobile()) this.sidenav.close();
  }

  logout() {
    this.auth.logout();
  }

  goSettings() {
    this.router.navigate(['/settings']);
  }
}
