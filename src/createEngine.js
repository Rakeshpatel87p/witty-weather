// Create story board
// Map onto functions

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
    var url = 'https://maps.googleapis.com/maps/api/directions/json?origin=Atlanta&destination=' + loc + '&key=AIzaSyA_2lY9VZ5_ohmSOkdvaDN2cGryDcecwmU';
    console.log(url, 'URL');
    return fetch(
        url
    ).then(res => res.json())
}

const firstEntityValue = (entities, name) => {
    const val = entities && entities[name] &&
        Array.isArray(entities[name]) &&
        entities[name].length > 0 &&
        entities[name][0].value;
    console.log('entities[name] or whatever that means-------', entities[name]);
    console.log('what are entities?-----------', entities);
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
            console.log('these are the args---------', args);
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
            // console.log("Code reached", res);
            // Tried changing to var/let
            const routeSummaryReturned = res.routes[0].summary;
            context.routeSummary = routeSummaryReturned
            return context;

            // Tried looping and returning a single value.
            // for (var i = 0; i < res.routes.length; i++) {
            //     const routeSummaryReturned = res.routes[i].summary;
            //     return context.routeSummary = routeSummaryReturned
            // };
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
        console.log('stringified-------', JSON.stringify(response))
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
