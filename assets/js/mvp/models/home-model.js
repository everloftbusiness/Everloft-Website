(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	var HomeModel = function () {
		this.contactEndpoint =
			"https://script.google.com/macros/s/AKfycbzx_nrsBJEch4mVMJmwyPRgOSBzQkOu5-VG1N4bOUEEz4LokTeTVDkCFM-bftuecfsN/exec";
	};

	HomeModel.prototype.submitContact = async function (formElement) {
		var requestFormData = new FormData(formElement);
		var response = null;

		try {
			response = await fetch(this.contactEndpoint, {
				method: "POST",
				headers: { Accept: "application/json" },
				body: requestFormData
			});
		} catch (corsError) {
			response = await fetch(this.contactEndpoint, {
				method: "POST",
				mode: "no-cors",
				body: new FormData(formElement)
			});
		}

		var isOpaqueResponse = response && response.type === "opaque";
		if (!isOpaqueResponse && !response.ok) {
			throw new Error("Non-2xx response from Google Sheet endpoint.");
		}

		if (!isOpaqueResponse) {
			var contentType = String(response.headers.get("content-type") || "").toLowerCase();
			if (contentType.indexOf("application/json") !== -1) {
				var result = null;
				try {
					result = await response.json();
				} catch (parseError) {
					result = null;
				}

				if (result) {
					var resultState = String(result.result || result.status || "").toLowerCase();
					if (resultState === "error" || resultState === "failed" || resultState === "failure") {
						throw new Error("Google Sheet script returned an error.");
					}
				}
			}
		}
	};

	app.Models.home = HomeModel;
})(window);
