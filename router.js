import Home from "./views/Home.js";
import MatchReports from "./views/Match.js";
import ScoutEntry from "./views/ScoutEntry.js";

export const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

export const router = async () => {
    const routes = [
        { path: '/scouting', view: Home() }, // index path for github pages
        { path: '/scouting/match', view: MatchReports() },
        { path: '/scouting/add', view: ScoutEntry() },
    ];

    const potentialMatches = routes.map(route => ({
        route,
        isMatch: location.pathname === route.path
    }));

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    // Route to home if path is not found
    if (!match) {
        match = {
            route: routes[0],
            isMatch: true
        };
    }

    // inject view into dom
    document.getElementById('app').innerHTML = await match.route.view;
};