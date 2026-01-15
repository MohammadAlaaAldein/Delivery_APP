import svgCaptcha from 'svg-captcha';

/********************************
* Always return SVG images by default.
* If you need to return PNG instead, use a supported package like `svg2img` or `sharp`.
* To trigger PNG conversion, pass the argument `getSvg = false`.
***********************************/
export const generateCaptcha = async (getSvg): Promise<{ text: string; img: string | Buffer }> => {
	try {
		let jpegOptions = {};
		const genericOptions = {
			size: 6,
			noise: 2,
			ignoreChars: "O0iIl1o",
		};

		if (!getSvg) {
			jpegOptions = {
				'height': 333,
				'width': 1000,
				'fontSize': 120
			};
		}

		const options = structuredClone({ ...genericOptions, ...jpegOptions });
		const svg = svgCaptcha.create(options);

		return { 'text': svg.text, 'img': svg.data };
	} catch (ex) {
		throw ex;
	}
}