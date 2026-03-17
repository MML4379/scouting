import { router, navigateTo } from "./router.js";

function init() {
    setupNavigation();
    router();
}

function setupNavigation() {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.href);
        }
    });
    
    window.addEventListener('popstate', router);
}

document.addEventListener('DOMContentLoaded', init);