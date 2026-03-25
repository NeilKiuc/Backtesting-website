import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
	},
	{
		path: 'dashboard',
		loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
	},
    {
		path: 'data',
		loadComponent: () => import('./pages/data/data').then((m) => m.Data),
	},
	{
		path: 'backtests',
		loadComponent: () => import('./pages/backtests/backtests').then((m) => m.Backtests),
	},
	{
		path: 'results',
		loadComponent: () => import('./pages/results/results').then((m) => m.Results),
	},
	{
		path: 'settings',
		loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
	},
	{
		path: '**',
		redirectTo: 'home',
	},
];
