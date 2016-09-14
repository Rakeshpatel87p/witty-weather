const { Wit } = require('node-wit');
const { WIT_TOKEN, WEATHER_APPID } = require('./config');
const fetch = require('isomorphic-fetch');
const request = require('request');

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

function forecastFor(apiRes) {
    return `${fahrenheit(apiRes.main.temp)}, ${apiRes.weather[0].description}`
}

function locationFor(apiRes) {
    return apiRes.name;
}

function fahrenheit(kelvin) {
    return `${Math.round(kelvin * 9/5 - 459.67)} °F`
}

function getWeather(loc) {
    return fetch(
    'https://maps.googleapis.com/maps/api/directions/json?origin=' + loc + '&destination=Mableton4&key=AIzaSyA_2lY9VZ5_ohmSOkdvaDN2cGryDcecwmU'
).then(res => res.json())
};

// 'http://api.openweathermap.org/data/2.5/weather?' + `q=${loc}&appid=${WEATHER_APPID}`

// const directionDetails = request.get({
//     uri: 'https://maps.googleapis.com/maps/api/directions/json',
//     method: 'GET',
//     // Is this proper? For https://maps.googleapis.com/maps/api/directions/json?origin=aaa?destination=bbb?key=
//     qs: {
//         origin: loc,
//         destination: 'Orlando',
//         key: 'AIzaSyA_2lY9VZ5_ohmSOkdvaDN2cGryDcecwmU'
//     },

// }, (response, err) => {
//     console.log('response', response, 'error', err);

// }
// );

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

const withForecast = (ctx, forecast) => {
    ctx.forecast = forecast;
    return ctx;
}

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

function fetchWeather({ context, entities }) {
    const location = firstEntityValue(entities, 'location');
    if (!location) return Promise.resolve(noLocation(context));
    return getWeather(location).then(
        res => {
            console.log('THIS IS RESPONSE FROM API CALL_________', res.routes);
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
        console.log('sending...', JSON.stringify(response));
        return Promise.resolve();
    },
    fetchWeather
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
