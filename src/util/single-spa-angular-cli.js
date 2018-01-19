import { setTimeout } from "timers";

const defaultOpts = {
	// required opts
	selector: null,
	baseScriptUrl: null,
	scripts: []
};

export default function singleSpaAngularCli(userOpts) {
	if (typeof userOpts !== 'object') {
		throw new Error(`single-spa-angular-mf requires a configuration object`);
	}

	const opts = {
		...defaultOpts,
		...userOpts,
	};

	if (typeof opts.selector !== 'string') {
		throw new Error(`single-spa-angular-mf must be passed opts.selector string`);
	}

	if (typeof opts.baseScriptUrl !== 'string') {
		throw new Error(`single-spa-angular-mf must be passed opts.baseScriptUrl string`);
	}

	if (typeof opts.scripts.length > 0) {
		throw new Error(`single-spa-angular-mf must be passed opts.scripts array not empty`);
	}

	return {
		bootstrap: bootstrap.bind(null, opts),
		mount: mount.bind(null, opts),
		unmount: unmount.bind(null, opts)
	};
}

function bootstrap(opts) {
	const domEl = getContainerEl(opts);
	return opts.scripts
		.reduce((prev, scriptName) => prev.then(loadScriptTag(`${opts.baseScriptUrl}/${scriptName}`, domEl)), Promise.resolve());
}

function mount(opts) {
	return new Promise((resolve, reject) => {
		const domEl = getContainerEl(opts);
		const angularRootEl = document.createElement(opts.selector);
		domEl.appendChild(angularRootEl);
		if(window[opts.selector]) {
			window[opts.selector].mount();
			resolve();
		} else {
			console.error(`Cannot mount ${opts.selector} because that is not bootstraped`);
			reject();
		}
	});
}

function unmount(opts) {
	return new Promise((resolve, reject) => {
		if(window[opts.selector]) {
			window[opts.selector].unmount();
			getContainerEl(opts).innerHTML = '';
			resolve();
		} else {
			reject(`Cannot unmount ${opts.selector} because that is not bootstraped`);
		}
	});
}

function getContainerEl(opts) {
	let el = document.querySelector(opts.selector);
	if (!el) {
		el = document.createElement(opts.selector);
		document.body.appendChild(el);
	}
	return el;
}

async function runPromisesInSequence(promises) {
	for (let promise of promises) {
		await promise();
	}
}

function loadScriptTag(url, domEl) {
	return () => {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.onload = function () {
				resolve();
			};
			script.onerror = err => {
				reject(err);
			};
			script.src = url;
			document.head.appendChild(script);
		});
	};
}