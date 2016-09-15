// Create story board
// Map onto functions
// Successfully Make API calls - return right data
// Upload onto FB Messenger

const { Wit } = require('node-wit');
const { WIT_TOKEN, WEATHER_APPID } = require('./config');
const fetch = require('isomorphic-fetch');
// const request = require('request');

// ------------------------------------------------------------
// Helpers

function mapObject(obj, f) {
    return Object
        .keys(obj)
        .map(k => [k, f(obj[k], k)])
        .reduce(
            (newObj, [k, v]) => {
                newObj[k] = v;
                return newObj;
            }, {}
        );
}

// function forecastFor(apiRes) {
//     return `${fahrenheit(apiRes.main.temp)}, ${apiRes.weather[0].description}`
// }

// function locationFor(apiRes) {
//     return apiRes.name;
// }

// function fahrenheit(kelvin) {
//     return `${Math.round(kelvin * 9/5 - 459.67)} °F`
// }

function getRoute(loc) {
    return fetch(
        'https://maps.googleapis.com/maps/api/directions/json?origin=Atlanta&destination=' + loc + '&key=AIzaSyA_2lY9VZ5_ohmSOkdvaDN2cGryDcecwmU'
    ).then(res => res.json())
}

const firstEntityValue = (entities, name) => {
    const val = entities && entities[name] &&
        Array.isArray(entities[name]) &&
        entities[name].length > 0 &&
        entities[name][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

const noop = () => {};

// ------------------------------------------------------------
// Actions

const noLocation = (ctx) => {
    ctx.missingLocation = true;
    delete ctx.forecast;
    return ctx;
}

const withLocation = (ctx, loc) => {
    ctx.location = loc;
    delete ctx.missingLocation;
    return ctx;
}

// const withForecast = (ctx, forecast) => {
//     ctx.forecast = forecast;
//     return ctx;
// }

const withAPIError = (ctx, err) => {
    ctx.apiError = true
    return ctx;
}

function wrapActions(actions, cb) {
    return mapObject(
        actions,
        (f, k) => function() {
            const args = [].slice.call(arguments);
            cb({ name: k, args })
            return f.apply(null, arguments);
        }
    );
}

function fetchBestRoute({ context, entities }) {
    const location = firstEntityValue(entities, 'location');
    if (!location) return Promise.resolve(noLocation(context));
    return getRoute(location).then(
        res => {
            for (var i = 0; i < res.routes.length; i++) {
                let routeSummaryReturned = res.routes[i].summary;
                console.log('routeSummaryReturned variable', routeSummaryReturned)
                return context.routeSummary = routeSummaryReturned
            };
            // return res.routes[0].summary;
            // return withLocation(
            //     withForecast(context, forecastFor(res)),
            //     locationFor(res)
            // );
        },
        err => withAPIError(withLocation(context, location), err)
    );
}

const actions = {
    send(request, response) {
        console.log('this is the response', response);
        // console.log('sending...', JSON.stringify(response));
        return Promise.resolve();
    },
    fetchBestRoute
};

// ------------------------------------------------------------
// init

function createEngine(accessToken, cb) {
    return new Wit({
        accessToken: WIT_TOKEN,
        actions: wrapActions(actions, cb || noop)
    });
}

module.exports = createEngine;
