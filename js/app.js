/**
 * js/app.js
 * 應用程式主入口
 */

const App = {
    user: null,
    currentTrip: null,

    init: () => {
        if (Auth.checkLogin()) {
            App.router.navigate('dashboard');
        } else {
            App.router.navigate('login');
        }
    },

    router: {
        navigate: (viewId) => {
            $all('.view-section').forEach(el => el.classList.add('hidden'));

            if (viewId !== 'login' && !App.user) {
                App.router.navigate('login');
                return;
            }

            const target = $(`#view-${viewId}`);
            if (target) {
                target.classList.remove('hidden');
                if (viewId === 'dashboard') Dashboard.init();
                if (viewId === 'admin') Admin.init();
            }

            App.updateNav();
        }
    },

    updateNav: () => {
        if (App.user) {
            $('#nav-user-name').textContent = App.user.name || App.user.email;
            // Avatar?
            if (App.user.avatar_url) {
                // simple impl
            }

            if (App.user.role === 'admin') {
                $('#nav-user-name').textContent += ' (管理者)';
                $('#nav-admin-link').classList.remove('hidden');
            } else {
                $('#nav-admin-link').classList.add('hidden');
            }
            $('#nav-links').classList.remove('hidden');
        } else {
            $('#nav-links').classList.add('hidden');
        }
    }
};

const Dashboard = {
    init: async () => {
        // 使用 Trip 模組初始化
        if (window.Trip) {
            await Trip.initDashboard();
        } else {
            console.error('Trip module not loaded');
        }
    }
};

window.App = App;
window.logout = Auth.logout;
window.navigateTo = App.router.navigate;

document.addEventListener('DOMContentLoaded', App.init);
