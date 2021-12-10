function copyToClipboard(textarea, data) {
	textarea.value = data;
	textarea.setAttribute("style", "");
	textarea.select();
	document.execCommand("copy");
	alert("Copied to clipboard!");
	textarea.setAttribute("style", "display:none");
}

Macro.add('canvasColoursEditor', {
	handler: function () {
		if (!Renderer.lastCall) return;
		let cheat = !!this.args[0];

		function redrawImg() {
			if (redrawImg.id) clearTimeout(redrawImg.id);
			// throttle a little to avoid immediate redraw
			redrawImg.id = setTimeout(() => {
				Wikifier.wikifyEval(' <<updatesidebarimg>>');
			}, 50);
		}

		let groups = [
			{
				name: 'Hair',
				colours: setup.colours.hair,
				default: setup.colours.hair_default,
				setVars(variable) {
					V.haircolour = variable;
					redrawImg();
				},
				exportPrefix: 'setup.colours.hair = ',
				exportSuffix: ';'
			}, {
				name: 'Eyes',
				colours: setup.colours.eyes,
				default: setup.colours.eyes_default,
				setVars(variable) {
					V.eyecolour = variable;
					redrawImg();
				},
				exportPrefix: 'setup.colours.eyes = ',
				exportSuffix: ';'
			}, {
				name: 'Clothes',
				colours: setup.colours.clothes,
				default: setup.colours.clothes_default,
				setVars(variable) {
					for (let item of Object.values(V.worn)) {
						if (item.colour !== 0) item.colour = variable;
						if (item.accessory_colour !== 0) item.accessory_colour = variable;
					}
					redrawImg();
				},
				exportPrefix: 'setup.colours.clothes = ',
				exportSuffix: ';'
			}, {
				name: 'Lipstick',
				colours: setup.colours.lipstick,
				default: setup.colours.lipstick_default,
				setVars(variable) {
					V.makeup.lipstick = variable;
					redrawImg();
				},
				exportPrefix: 'setup.colours.lipstick = ',
				exportSuffix: ';'
			}, {
				name: 'Eyeshadow',
				colours: setup.colours.eyeshadow,
				default: setup.colours.eyeshadow_default,
				setVars(variable) {
					V.makeup.eyeshadow = variable;
					redrawImg();
				},
				exportPrefix: 'setup.colours.eyeshadow = ',
				exportSuffix: ';'
			}, {
				name: 'Mascara',
				colours: setup.colours.mascara,
				default: setup.colours.mascara_default,
				setVars(variable) {
					V.makeup.mascara = variable;
					redrawImg();
				},
				exportPrefix: 'setup.colours.mascara = ',
				exportSuffix: ';'
			}
		]
		elechildren(this.output,
			cheat ? "Links will re-colour your character. Won't check for clothes' list of valid colours, use for debugging purposes only! " : "",
			element('div',
				{class: 'editorcolours'},
				groups.map(group =>
					element('div',
						[
							element('div',
								{ class: 'export-block' },
								[
									element('a', {
										onclick() {
											let textarea = this.parentElement.querySelector('textarea');
											let colours = group.colours.map(c => {
												// Make deep copy and delete defaults
												let c2 = clone(c);
												for (let k in group.default) {
													if (c2.canvasfilter[k] === group.default[k]) {
														delete c2.canvasfilter[k];
													} else if (k === "contrast") {
														if ('contrast' in c2.canvasfilter) {
															c2.canvasfilter.contrast /= group.default.contrast;
														}
													} else if (k === 'brightness') {
														if ('brightness' in c2.canvasfilter) {
															c2.canvasfilter.brightness -= group.default.brightness;
														}
													}
												}
												return c2;
											});
											copyToClipboard(textarea, group.exportPrefix +
												JSON.stringify(colours) +
												group.exportSuffix);
										}
									}, 'Export'),
									element('textarea', {style: 'display:none'})
								]
							), // div.export-block
							element('h4',
								[
									group.name,
									element('br')
								]
							),
							element('table',
								[
									element('thead', [
										element('th',''),
										element('th','Brightness'),
										element('th','Contrast'),
										element('th',''),
									]),
									element('tbody',
										group.colours.map(colour =>
											element('tr', {},
												[
													element('td', [
														eInput({
															type: 'color',
															value: colour.canvasfilter.blend,
															set(value) {
																colour.canvasfilter.blend = value;
																redrawImg();
															}
														})
													]),
													element('td', [
														eInput({
															type: 'number',
															class: 'editlayer-brightness',
															value: colour.canvasfilter.brightness,
															set(value) {
																colour.canvasfilter.brightness = value;
																redrawImg();
															},
															min: -1,
															max: +1,
															step: 0.01
														}),
													]),
													element('td', [
														eInput({
															type: 'number',
															class: 'editlayer-contrast',
															value: colour.canvasfilter.contrast,
															set(value) {
																colour.canvasfilter.contrast = value;
																redrawImg();
															},
															min: 0,
															max: +4,
															step: 0.01
														}),
													]),
													element('td', [
														cheat ? element('a', {
																onclick() {
																	group.setVars(colour.variable);
																	redrawImg();
																}
															},
															' ' + colour.name_cap)
															: (' ' + colour.name_cap)
													])
												]
											) // colour div
										) // colours (tbody children)
									) // tbody
								] // table children
							), // table
						] // group div children
					) // group div
				) // groups
			) // div flex
		) // this.output
	}
});
Macro.add('canvasLayersEditor', {
	handler: function () {
		if (!Renderer.lastCall) return;
		let layers = Renderer.lastCall[1];

		function redraw() {
			// TODO @aimozg make it work in static render mode too
			Renderer.lastAnimation.invalidateCaches();
			Renderer.lastAnimation.redraw(); // it will queue redraw on next animation frame, so shouldn't lag much
		}

		function redrawFull() {
			// TODO @aimozg make it work in static render mode too
			Renderer.lastAnimation.stop();
			Renderer.animateLayersAgain();
		}

		elechild(this.output, element('div', [
			element('button', {
				type: 'button',
				onclick() {
					let layerProps = ["name", "show", "src", "mask", "z", "alpha", "desaturate", "brightness", "blendMode", "blend", "animation", "frames", "dx", "dy", "width", "height"];
					copyToClipboard(this.parentElement.querySelector("textarea"), JSON.stringify(layers.map(layer => {
						let copy = {};
						for (let key of layerProps) {
							if (key in layer && layer.show !== false) copy[key] = layer[key];
						}
						return copy
					})))
				}
			}, 'Export'),
			element('textarea', {style: 'display:none'})
		]));
		elechild(this.output, element('table', {class: 'editorlayers'}, [
			element('thead', [
				element('tr',
					[
						element('th', 'name'),
						element('th', 'show'),
						element('th', 'src'),
						element('th', 'z'),
						element('th', 'alpha'),
						element('th', 'desaturate'),
						element('th', 'brightness'),
						element('th', 'contrast'),
						element('th', 'blendMode'),
						element('th', 'blend'),
						element('th', 'animation'),
						element('th', 'mask')
					])]),
			element('tbody',
				layers.map(layer => element('tr', [
					element('th', layer.name || ''),
					element('td', eCheckbox({
						class: 'editlayer-show',
						value: !!layer.show,
						set(value) {
							layer.show = value;
							redraw();
						}
					})),
					element('td', [
							element('a', {
								onclick() {
									delete Renderer.ImageCaches[layer.src];
									layer.src = layer.src.split('#')[0] + '#' + new Date().getTime()
									redraw();
								}
							}, '↺'),
							eInput({
								class: 'editlayer-src',
								value: layer.src.split('#')[0],
								set(value) {
									layer.src = value;
									redraw();
								}
							})
						]
					),
					element('td', eInput({
						class: 'editlayer-z',
						type: 'number',
						value: layer.z,
						set(value) {
							layer.z = value;
							redraw();
						}
					})),
					element('td', eInput({
						class: 'editlayer-alpha',
						type: 'number',
						value: layer.alpha,
						set(value) {
							layer.alpha = value;
							redraw();
						},
						min: 0,
						max: 1,
						step: 0.1
					})),
					element('td', eCheckbox({
						value: layer.desaturate,
						set(value) {
							layer.desaturate = value;
							redraw();
						},
						class: 'editlayer-desaturate'
					})),
					element('td', eInput({
						class: 'editlayer-brightness',
						type: 'number',
						value: layer.brightness,
						set(value) {
							layer.brightness = value;
							redraw();
						},
						min: -1,
						max: +1,
						step: 0.01
					})),
					element('td', eInput({
						class: 'editlayer-contrast',
						type: 'number',
						value: layer.contrast,
						set(value) {
							layer.contrast = value;
							redraw();
						},
						min: 0,
						max: +4,
						step: 0.01
					})),
					element('td', eSelect({
						class: 'editlayer-blendmode',
						items: [{
							value: '',
							text: 'none'
						}, 'hard-light', 'multiply', 'screen', 'soft-light', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn'],
						value: layer.blendMode,
						set(value) {
							layer.blendMode = value;
							redraw();
						}
					})),
					element('td', eInput({
						type: 'color',
						value: layer.blend,
						set(value) {
							layer.blend = value;
							redraw();
						},
						class: 'editlayer-blend'
					})),
					element('td', eInput({
						class: 'editlayer-animation',
						value: layer.animation,
						onchange: function () {
							layer.animation = this.value;
							redrawFull();
						}
					})),
					element('td', eInput({
						class: 'editlayer-masksrc',
						value: layer.masksrc,
						onchange: function () {
							layer.masksrc = this.value;
							redrawFull();
						}
					}))
				]))
			)
		]));
	}
})
Macro.add('canvasModelEditor', {
	handler: function () {
		let model = Renderer.lastModel;
		if (!model) return;
		let options = model.options;

		function redraw() {
			model.redraw();
		}

		let optionListeners = []; // list of functions to call when model is imported
		function updateControls() {
			for (let control of optionListeners) control();
		}

		function optionCategory(name) {
			return element('div', {class: 'optioncategory'}, name);
		}

		function optionContainer(name, editor) {
			return [
				element('label', {class: 'optionlabel', 'for': 'modeloption-' + name}, name),
				element('div', {class: 'optioneditor'}, editor)
			]
		}

		function booleanOption(name) {
			return optionContainer(name,
				eCheckbox({
					id: 'modeloption-' + name,
					value: options[name],
					set(value) {
						options[name] = value;
						redraw();
					},
					$oncreate(e) {
						optionListeners.push(() => {
							e.value = options[name]
						})
					}
				})
			);
		}

		function stringOption(name) {
			return optionContainer(name, eInput({
				id: 'modeloption-' + name,
				value: options[name],
				type: 'text',
				set(value) {
					options[name] = value;
					redraw()
				},
				$oncreate(e) {
					optionListeners.push(() => {
						e.value = options[name]
					})
				}
			}))
		}

		function numberOption(name, min, max, step, range) {
			let rangeLabel;
			if (range) {
				rangeLabel = element('label',
					{'for': 'modeloption-' + name},
					'' + options[name]
				)
			} else {
				rangeLabel = '';
			}
			return optionContainer(name, [
					eInput({
						id: 'modeloption-' + name,
						value: options[name],
						type: range ? 'range' : 'number',
						min: min,
						max: max,
						step: step,
						set(value) {
							if (rangeLabel) rangeLabel.textContent = value;
							options[name] = value;
							redraw();
						},
						$oncreate(e) {
							optionListeners.push(() => {
								e.value = options[name]
							})
						}
					}),
					rangeLabel
				]
			);
		}

		function selectOption(name, values, number) {
			return optionContainer(name,
				eSelect({
					id: 'modeloption-' + name,
					items: values,
					value: options[name],
					set(value) {
						if (number) value = +value;
						options[name] = value;
						redraw();
					},
					$oncreate(e) {
						optionListeners.push(() => {
							e.value = options[name]
						})
					}
				})
			);
		}

		let generatedOptions = model.generatedOptions();
		if (model.name !== "main") {
			elechild(this.output, element('div', [
					element('h3', 'Model options'),
					element('div', {class: 'editormodelgroups'}, [
							element('div', {class: 'editormodelgroup'},
								Object.keys(model.options)
									.filter(opt => !generatedOptions.includes(options) && opt !== 'filters')
									.map(opt => {
										let value = model.options[opt];
										switch (typeof value) {
											case 'number':
												return numberOption(opt);
											case 'boolean':
												return booleanOption(opt);
											case 'string':
											default:
												return stringOption(opt);
										}
									})
							)
						]
					)
				])
			)
			return;
		}
		let bodyWritings = ["", ...Object.keys(setup.bodywriting)];

		let hairColourOptions = [...Object.keys(setup.colours.hair_map), "custom"];
		let xhairColourOptions = ["", ...Object.keys(setup.colours.hair_map), "custom"];
		let clothesColourOptions = [...Object.keys(setup.colours.clothes_map), "custom"];
		let eyesColourOptions = [...Object.keys(setup.colours.eyes_map), "custom"];
		let lipstickColourOptions = [...Object.keys(setup.colours.lipstick_map), "", "custom"];
		let eyeshadowColourOptions = [...Object.keys(setup.colours.eyeshadow_map), "", "custom"];
		let mascaraColourOptions = [...Object.keys(setup.colours.mascara_map), "", "custom"];
		elechild(this.output, element('div', [
			element('button', {
				type: 'button',
				onclick() {
					let ocopy = {};
					let defaults = model.defaultOptions();
					for (let key of Object.keys(options)) {
						if (generatedOptions.includes(key)) continue;
						if (key === 'filters') continue;
						if (options[key] === defaults[key]) continue;
						ocopy[key] = options[key];
					}
					copyToClipboard(this.parentElement.querySelector("textarea"), JSON.stringify(ocopy))
				}
			}, 'Export'),
			element('button', {
				type: 'button',
				onclick() {
					let textarea = this.parentElement.querySelector("textarea");
					if (textarea.getAttribute('style')) {
						textarea.setAttribute('style', '');
						textarea.value = '';
						this.textContent = "Paste and click again to import";
					} else {
						let ioptions = JSON.parse(textarea.value);
						Object.assign(options, ioptions);
						model.redraw();
						updateControls();
						textarea.setAttribute('style', 'display:none');
						this.textContent = "Import";
					}
				}
			}, 'Import'),
			element('textarea', {rows: 1, style: 'display:none'})
		]));
		elechild(this.output, element('div', [
			element('h3', 'Model options'),
			element('div', {class: 'editormodelgroups'}, [
				element('div', {class: 'editormodelgroup'},
					[
						optionCategory("Group toggles"),
						booleanOption("show_face"),
						booleanOption("show_hair"),
						booleanOption("show_tanlines"),
						booleanOption("show_writings"),
						booleanOption("show_tf"),
						booleanOption("show_clothes"),
						optionCategory("Body"),
						booleanOption("mannequin"),
						selectOption("breasts", ["", "default", "cleavage"]),
						numberOption("breast_size", 1, 6, 1),
						booleanOption("crotch_visible"),
						booleanOption("crotch_exposed"),
						selectOption("penis", ["", "default", "virgin"]),
						numberOption("penis_size", -2, 4, 1),
						selectOption("penis_parasite", ["", "urchin", "slime"]),
						booleanOption("balls"),
						selectOption("nipples_parasite", ["", "urchin", "slime"]),
						selectOption("clit_parasite", ["", "urchin", "slime"]),
						selectOption("arm_left", ["none", "idle", "cover"]),
						selectOption("arm_right", ["none", "idle", "cover"]),

						optionCategory("Skin"),
						selectOption("skin_type", ["light", "medium", "dark", "gyaru", "ylight", "ymedium", "ydark", "ygyaru"]),
						numberOption("skin_tone", 0, 1, 0.01, true),
						numberOption("skin_tone_breasts", -0.01, 1, 0.01, true),
						numberOption("skin_tone_penis", -0.01, 1, 0.01, true),
						numberOption("skin_tone_swimshorts", -0.01, 1, 0.01, true),
						numberOption("skin_tone_swimsuitTop", -0.01, 1, 0.01, true),
						numberOption("skin_tone_swimsuitBottom", -0.01, 1, 0.01, true),
						numberOption("skin_tone_bikiniTop", -0.01, 1, 0.01, true),
						numberOption("skin_tone_bikiniBottom", -0.01, 1, 0.01, true),

						optionCategory("Hair"),
						selectOption("hair_colour", hairColourOptions),
						selectOption("hair_sides_type", ["", "default", "braid left", "braid right", "flat ponytail", "loose", "messy", "pigtails", "ponytail", "short", "side tail left", "side tail right", "straight", "swept left", "twin braids", "twintails", "curl", "neat"]),
						selectOption("hair_sides_length", ["short", "shoulder", "chest", "navel", "thighs", "feet"]),
						selectOption("hair_sides_position", ["front", "back"]),
						selectOption("hair_fringe_type", ["", "default", "thin flaps", "wide flaps", "hime", "loose", "messy", "overgrown", "ringlets", "split", "straight", "swept left", "back", "parted", "flat", "quiff", "straight curl", "ringlet curl", "curtain"]),
						selectOption("hair_fringe_length", ["short", "shoulder", "chest", "navel", "thighs", "feet"]),
						selectOption("brows_colour", xhairColourOptions),
						selectOption("pbhair_colour", xhairColourOptions),
						numberOption("pbhair_level", 0, 9, 1),
						numberOption("pbhair_strip", 0, 3, 1),
						numberOption("pbhair_balls", 0, 9, 1),

						optionCategory("Face"),
						selectOption("facestyle", ["default"]),
						booleanOption("freckles"),
						booleanOption("trauma"),
						booleanOption("blink"),
						booleanOption("eyes_half"),
						booleanOption("eyes_bloodshot"),
						selectOption("eyes_colour", eyesColourOptions),
						selectOption("brows", ["none", "top", "low", "orgasm", "mid"]),
						selectOption("mouth", ["none", "neutral", "cry", "frown", "smile"]),
						numberOption("tears", 0, 4, 1),
						numberOption("blush", 0, 5, 1),
						selectOption("lipstick_colour", lipstickColourOptions),
						selectOption("eyeshadow_colour", eyeshadowColourOptions),
						selectOption("mascara_colour", mascaraColourOptions),

						optionCategory("Misc"),
						booleanOption("upper_tucked"),
						booleanOption("hood_down")
					]),
				element('div', {class: 'editormodelgroup'},
					[
						optionCategory("Transformations"),
						selectOption("angel_wings_type", ["disabled", "hidden", "default"]),
						selectOption("angel_wing_right", ["idle", "cover"]),
						selectOption("angel_wing_left", ["idle", "cover"]),
						selectOption("angel_halo_type", ["disabled", "hidden", "default"]),
						selectOption("fallen_wings_type", ["disabled", "hidden", "default"]),
						selectOption("fallen_wing_right", ["idle", "cover"]),
						selectOption("fallen_wing_left", ["idle", "cover"]),
						selectOption("fallen_halo_type", ["disabled", "hidden", "default"]),
						selectOption("demon_wings_type", ["disabled", "hidden", "default"]),
						selectOption("demon_wings_state", ["idle", "cover", "flaunt"]),
						selectOption("demon_tail_type", ["disabled", "hidden", "default", "classic"]),
						selectOption("demon_tail_state", ["idle", "cover", "flaunt"]),
						selectOption("demon_horns_type", ["disabled", "hidden", "default", "classic"]),
						selectOption("wolf_tail_type", ["disabled", "hidden", "default", "feral"]),
						selectOption("wolf_ears_type", ["disabled", "hidden", "default", "feral"]),
						selectOption("wolf_pits_type", ["disabled", "hidden", "default"]),
						selectOption("wolf_pubes_type", ["disabled", "hidden", "default"]),
						selectOption("wolf_cheeks_type", ["disabled", "hidden", "feral"]),
						selectOption("cat_tail_type", ["disabled", "hidden", "default"]),
						selectOption("cat_ears_type", ["disabled", "hidden", "default"]),
						selectOption("cow_horns_type", ["disabled", "hidden", "default"]),
						selectOption("cow_tail_type", ["disabled", "hidden", "default"]),
						selectOption("cow_ears_type", ["disabled", "hidden", "default"]),
						selectOption("bird_wings_type", ["disabled", "hidden", "default"]),
						selectOption("bird_wing_right", ["idle", "cover"]),
						selectOption("bird_wing_left", ["idle", "cover"]),
						selectOption("bird_tail_type", ["disabled", "hidden", "default"]),
						selectOption("bird_eyes_type", ["disabled", "hidden", "default"]),
						selectOption("bird_malar_type", ["disabled", "hidden", "default"]),
						selectOption("bird_plumage_type", ["disabled", "hidden", "default"]),
						selectOption("bird_pubes_type", ["disabled", "hidden", "default"]),

						optionCategory("Body writings"),
						selectOption("writing_forehead", bodyWritings),
						selectOption("writing_left_cheek", bodyWritings),
						selectOption("writing_right_cheek", bodyWritings),
						selectOption("writing_breasts", bodyWritings),
						selectOption("writing_breasts_extra", bodyWritings),
						selectOption("writing_left_shoulder", bodyWritings),
						selectOption("writing_right_shoulder", bodyWritings),
						selectOption("writing_pubic", bodyWritings),
						selectOption("writing_left_thigh", bodyWritings),
						selectOption("writing_right_thigh", bodyWritings),

						optionCategory("Dripping fluids"),
						selectOption("drip_vaginal", ["", "Start", "VerySlow", "Slow", "Fast", "VeryFast"]),
						selectOption("drip_anal", ["", "Start", "VerySlow", "Slow", "Fast", "VeryFast"]),
						selectOption("drip_mouth", ["", "Start", "VerySlow", "Slow", "Fast", "VeryFast"]),
					]),
				element('div', {class: 'editormodelgroup'},
					[
						setup.clothes_all_slots.map(slot => [
							optionCategory("Clothes: " + slot),
							selectOption("worn_" + slot,
								Object.values(setup.clothes[slot]).map(item => ({
									value: item.index,
									text: item.name
								})),
								true
							),
							numberOption("worn_" + slot + "_alpha", 0, 1, 0.1, true),
							selectOption("worn_" + slot + "_integrity", ["tattered", "torn", "frayed", "full"]),
							selectOption("worn_" + slot + "_colour", clothesColourOptions),
							selectOption("worn_" + slot + "_acc_colour", clothesColourOptions)
						])
					]
				)])
		]))
	}
})
