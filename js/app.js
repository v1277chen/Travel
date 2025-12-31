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
        $('#trip-list').innerHTML = '<div class="spinner"></div>';
        try {
            // 目前後端可能尚未實作 getTrips，這裡會失敗
            // const trips = await apiService.call('getTrips');
            const trips = []; // 暫時假資料
            Dashboard.render(trips);
        } catch (e) {
            $('#trip-list').innerHTML = '<p class="text-center">載入失敗</p>';
        }
    },

    render: (trips) => {
        const container = $('#trip-list');
        if (trips.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p>目前沒有任何行程。</p>
                    <button class="btn btn-primary" onclick="openCreateTripModal()">建立新行程</button>
                </div>`;
            return;
        }
        // ...
    }
};

window.App = App;
window.logout = Auth.logout;
window.navigateTo = App.router.navigate;

document.addEventListener('DOMContentLoaded', App.init);
