import Cycle from '@cycle/core';
import {Observable} from 'rx';
import {div, label, input, hr, ul, li, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories?q=';

  // Requests for Github repositories happen when the input field changes,
  // debounced by 500ms, ignoring empty input field.
  const searchRequest$ = sources.DOM.select('.field').events('input')
    .debounce(500)
    .map(ev => ev.target.value)
    .filter(query => query.length > 0)
    .map(q => GITHUB_SEARCH_API + encodeURI(q));

  // Requests unrelated to the Github search. This is to demonstrate
  // how filtering for the correct HTTP responses is necessary.
  const otherRequest$ = Observable.interval(1000).take(2)
    .map(() => 'http://www.google.com');

  // Convert the stream of HTTP responses to virtual DOM elements.
  const vtree$ = sources.HTTP
    .filter(res$ => res$.request.url.indexOf(GITHUB_SEARCH_API) === 0)
    .flatMap(x => x)
    .map(res => res.body.items)
    .startWith([])
    .map(results =>
      div([
        label({className: 'label'}, 'Search:'),
        input({className: 'field', attributes: {type: 'text'}}),
        hr(),
        ul({className: 'search-results'}, results.map(result =>
          li({className: 'search-result'}, [
            a({href: result.html_url}, result.name)
          ])
        ))
      ])
    );

  const request$ = searchRequest$.merge(otherRequest$);

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
