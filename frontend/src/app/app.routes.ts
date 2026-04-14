import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login').then((m) => m.Login),
	},
	{
		path: 'callback',
		loadComponent: () => import('./pages/auth-callback/auth-callback').then((m) => m.AuthCallback),
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
	},
	{
		path: 'data',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/data/data').then((m) => m.Data),
	},
	{
		path: 'backtests',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/backtests/backtests').then((m) => m.Backtests),
	},
	{
		path: 'results',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/results/results').then((m) => m.Results),
	},
	{
		path: 'settings',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
