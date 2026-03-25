import { router, navigateTo } from "./router.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

function init() {
    setupNavigation();
    router();


}

function createSupabase() {
    const url = "https://zczcyfyrltmgokklvhkz.supabase.co";
    const key = "sb_publishable_qOA9FqZ4_OByDK4_QPlp9g_Dd4i2xe9";

    const supabase = createClient(url, key);
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