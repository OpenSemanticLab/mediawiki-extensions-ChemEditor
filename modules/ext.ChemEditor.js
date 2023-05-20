/*@nomin*/

(function () {

	/**
	 * @class mw.ChemEditor
	 * @singleton
	 */
	mw.ChemEditor = {
	};

}());

var displayMolekule = function (context) {
	return function (data) {
		if (context.source === "smw") {
			var property = 'Has sdf';
			if (context.view === '3d') property = 'Has sdf 3d';
			for (var key in data.query.results) {
				if (data.query.results[key].printouts[property][0] !== undefined) {
					context.sdf = data.query.results[key].printouts[property][0];
					if (context.debug) console.log(context.sdf);
					context.chemViewer.loadFromData(context.sdf, 'chemical/x-mdl-sdfile');
				}
			}
		}
		if (context.source === "pubchem") {
			context.sdf = data;
			if (context.debug) console.log(context.sdf);
			context.chemViewer.loadFromData(context.sdf, 'chemical/x-mdl-sdfile');
		}
	};
};

$(document).ready(function () {
	if ($(".div_kekule_view").length && $(".div_kekule_composer").length && $(".div_kekule_view_edit").length > 0) return;

	$.when(
		mw.loader.using('ext.ChemEditor.kekule'),
		mw.loader.using('ext.ChemEditor.utils') //threejs only needed for viewer
	).done(function () {

		var debug = false;
		Kekule.environment.setEnvVar('indigo.path', '/w/extensions/ChemEditor/modules/kekule/extra/');
		Kekule.Indigo.enable(function (error) {
			if (debug) console.log('Indigo loaded');

			$(".div_kekule_composer").each(function (index) {
				var div_element = $(this);
				const config = div_element.data('config') ? div_element.data('config') : {};
				var page = config.file_title ? config.file_title : div_element.text(); //read data from div content
				var file_label = config.file_label ? config.file_label : page.replace("File:", "").split(".")[0];
				div_element.text(''); //clear div content
				div_element.show(); //ensure visibility

				var composer = new Kekule.Editor.Composer(document.getElementById(div_element.attr('id')));
				var context = {};
				context.debug = debug;
				if (context.debug) console.log(page);
				context.composer = composer;
				context.page = page;
				context.file_label = file_label;
				context.api = new mw.Api();
				initComposer(context);

				var query = "/w/index.php?title=" + context.page + "&action=raw";
				$.ajax({
					url: query,
					dataType: "text",
					success: displayKekuleDocument(context)
				});


			});

			$(".div_kekule_view").each(function (index) {
				var div_element = $(this);

				var data = div_element.html(); //read data from div content

				div_element.html(''); //clear div content
				div_element.show(); //ensure visibility

				var chemViewer = new Kekule.ChemWidget.Viewer(document.getElementById(div_element.attr('id')));
				var context = {};
				context.debug = debug;
				if (context.debug) console.log(data);
				context.chemViewer = chemViewer;
				context.source = "smw"
				if (div_element.hasClass('div_kekule_source_pubchem')) context.source = "pubchem";

				// set new object in viewer
				var myMolecule = '';
				if (div_element.hasClass('div_kekule_format_smi')) {
					if (context.debug) console.log('Format: SMI');
					myMolecule = Kekule.IO.loadFormatData(data, 'smi');
					chemViewer.setChemObj(myMolecule);
				}
				else if (div_element.hasClass('div_kekule_format_mol')) {
					if (context.debug) console.log('Format: MOL');
					if (div_element.hasClass('div_kekule_view_3d')) {
						if (context.debug) console.log('View: 3D');
						chemViewer.setRenderType(Kekule.Render.RendererType.R3D);
					}
					myMolecule = Kekule.IO.loadFormatData(data, 'mol');
					chemViewer.setChemObj(myMolecule);
				}
				else if (div_element.hasClass('div_kekule_format_sdf')) {
					context.format = 'sdf';
					if (context.debug) console.log('Format: SDF');
					var query = "api.php?action=ask&query=[[" + encodeURIComponent(data) + "]]+|%3FHas+sdf&format=json";
					if (context.source === "pubchem") query = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/" + data + "/record/SDF/?record_type=2d&response_type=display";
					if (div_element.hasClass('div_kekule_view_3d')) {
						if (context.debug) console.log('View: 3D');
						context.view = '3d';
						chemViewer.setRenderType(Kekule.Render.RendererType.R3D);
						query = "api.php?action=ask&query=[[" + encodeURIComponent(data) + "]]+|%3FHas+sdf+3d&format=json";
						if (context.source === "pubchem") query = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/" + data + "/record/SDF/?record_type=3d&response_type=display";
					}

					if (context.source === "smw") {
						$.ajax({
							url: query,
							dataType: "json",
							cache: false,
							success: displayMolekule(context)
						});
					}
					//chemViewer.loadFromData(data, 'chemical/x-mdl-sdfile');
					//myMolecule = Kekule.IO.loadTypedData(data, 'chemical/x-mdl-sdfile');
					//chemViewer.setChemObj(myMolecule);
					if (context.source === "pubchem") {
						$.ajax({
							url: query,
							dataType: "text",
							cache: true,
							crossDomain: true,
							success: displayMolekule(context)
						});
					}

				}
				chemViewer.setEnableToolbar(true);
				chemViewer.setEnableDirectInteraction(true);
				chemViewer.setEnableEdit(true);
				chemViewer.setToolButtons([
					'loadData', 'saveData', 'molDisplayType', 'molHideHydrogens',
					'zoomIn', 'zoomOut',
					'rotateLeft', 'rotateRight', 'rotateX', 'rotateY', 'rotateZ',
					'reset', 'copy', 'config'
				]);

			});

			//Viewer for kekule docs, can open an editor and save changes
			$(".div_kekule_view_edit").each(function (index) {
				var div_element = $(this);
				const config = div_element.data('config') ? div_element.data('config') : {};
				var page = config.file_title ? config.file_title : div_element.text(); //read data from div content
				var file_label = config.file_label ? config.file_label : page.replace("File:", "").split(".")[0];

				div_element.html(''); //clear div content
				div_element.show(); //ensure visibility

				var chemViewer = new Kekule.ChemWidget.Viewer(document.getElementById(div_element.attr('id')));
				var context = {};
				context.debug = debug;
				if (context.debug) console.log(page);
				context.chemViewer = chemViewer;
				context.page = page;
				context.file_label = file_label;
				context.defaultPage = "Template:Editor/Kekule/Default";
				context.api = new mw.Api();

				chemViewer.setEnableToolbar(true);
				chemViewer.setEnableDirectInteraction(true);
				chemViewer.setEnableEdit(true);
				chemViewer.setToolButtons([
					'loadData', 'saveData', 'molDisplayType', 'molHideHydrogens',
					'zoomIn', 'zoomOut',
					'rotateLeft', 'rotateRight', 'rotateX', 'rotateY', 'rotateZ',
					'reset', 'copy', 'openEditor', 'config'
				]);
				chemViewer.setEditorProperties({
					'predefinedSetting': 'fullFunc',
					//'commonToolButtons': ['loadData','saveData',
					//						'undo','redo','copy','cut','paste',
					//						'zoomIn','zoomOut','config','objInspector'
					//					]
					//'chemToolButtons': ['manipulate', 'erase', 'bond', 'atom']
				});
				chemViewer.on('load', function (e) {
					if (context.debug) console.log('Object loaded', e.obj);
				});
				chemViewer.on('editingDone', function (e) {
					if (context.debug) console.log('Object edited', e.obj);
					context.chemObj = e.obj;
					//context.chemObj = e.widget.getChemObj();
					saveChemObj(context)();
				});

				var query = "/w/index.php?title=" + context.page + "&action=raw";
				$.getJSON("/w/api.php?action=query&prop=revisions&titles=File:" + context.page + "&rvprop=content&formatversion=2&format=json", viewKekuleDocument(context));
			});
		});
	});//getScript
});//document.ready

var viewKekuleDocument = function (context) {
	return function (data) {
		if (data.query.pages[0].hasOwnProperty("missing") && data.query.pages[0].missing === true) {
			if (context.debug) console.log("Page does not exist");
			$.getJSON("/w/api.php?action=query&prop=revisions&titles=" + context.defaultPage + "&rvprop=content&formatversion=2&format=json", viewKekuleDocument(context));
		}
		else {
			var content = data.query.pages[0].revisions[0].content;
			if (context.debug) console.log("Page exists:" + content);
			if (data.query.pages[0].title == context.defaultPage) context.chemViewer.loadFromData(content, 'chemical/x-kekule-json');
			else {
				$.ajax({
					url: "/wiki/Special:Redirect/file/" + context.page,
					dataType: "text",
					success: function (data) {
						if (context.debug) console.log(data);

						//var kekule_doc = Kekule.IO.loadTypedData(data, 'chemical/x-kekule-json');
						//context.chemViewer.setChemObj(kekule_doc);
						//context.composer.getChemObj().setRenderOption('useAtomSpecifiedColor', true);
						context.chemViewer.loadFromData(data, 'chemical/x-kekule-json');
					}
				});
			}
		}
	};
};

var displayKekuleDocument = function (context) {
	return function (data) {
		if (context.debug) console.log(data);
		var kekule_doc = Kekule.IO.loadTypedData(data, 'chemical/x-kekule-json');
		context.composer.setChemObj(kekule_doc);
		context.composer.getChemObj().setRenderOption('useAtomSpecifiedColor', true);
		//context.composer.loadFromData(data, 'chemical/x-kekule-json');
	};
};

var saveKekuleDocument = function (context) {
	return function () {
		//var renderConfigs = new Kekule.Render.Render2DConfigs();
		//renderConfigs.getColorConfigs().setUseAtomSpecifiedColor(true);
		//context.composer.setEditorProperties({'renderConfigs': renderConfigs});
		context.chemObj = context.composer.getChemObj();
		saveChemObj(context)();
	};
};

var saveChemObj = function (context) {
	return function () {
		//context.chemObj.setRenderOption('useAtomSpecifiedColor', true);
		// or context.chemObj.setRenderOptions({'useAtomSpecifiedColor': true});
		var doc = Kekule.IO.saveFormatData(context.chemObj, 'Kekule-JSON');
		if (context.debug) console.log(doc);
		const blob = new Blob([doc], { type: 'application/json' });
		KekuleEditor_uploadBlob(blob, context.page, "", "Created with KekuleEditor", context.debug, context.file_label);
	};
};

var initComposer = function (context) {
	var composer = context.composer;
	//code generated here: https://partridgejiang.github.io/Kekule.js/demos/demoLauncher.html?id=composerCustomization	
	var N = Kekule.ChemWidget.ComponentWidgetNames;
	var C = Kekule.Editor.ObjModifier.Category;

	// Common toolbar buttons
	composer.setCommonToolButtons([
		N.newDoc,
		N.loadData,
		N.saveData,
		N.undo,
		N.redo,
		N.copy,
		N.cut,
		N.paste,
		N.zoomIn,
		N.zoomOut,
		N.config,
		N.objInspector,
		{
			'text': 'Save',  // button caption
			'htmlClass': 'K-Res-Button-YesOk',  // show a OK icon
			'showText': true,   // display caption of button
			'hint': "Save in wiki",
			'#execute': saveKekuleDocument(context)  // event handler when executing the button
		}//Button not visible
	]);

	// Chem toolbar buttons
	composer.setChemToolButtons([
		{
			"name": N.manipulate,
			"attached": [
				N.manipulateMarquee,
				N.manipulateLasso,
				N.manipulateBrush,
				N.manipulateAncestor,
				N.dragScroll,
				N.toggleSelect
			]
		},
		N.erase,
		{
			"name": N.molBond,
			"attached": [
				N.molBondSingle,
				N.molBondDouble,
				N.molBondTriple,
				N.molBondWedgeUp,
				N.molBondWedgeDown,
				N.molChain,
				N.trackInput,
				N.molRepFischer1,
				N.molRepSawhorseStaggered,
				N.molRepSawhorseEclipsed
			]
		},
		{
			"name": N.molAtomAndFormula,
			"attached": [
				N.molAtom,
				N.molFormula
			]
		},
		{
			"name": N.molRing,
			"attached": [
				N.molRing3,
				N.molRing4,
				N.molRing5,
				N.molRing6,
				N.molFlexRing,
				N.molRingAr6,
				N.molRepCyclopentaneHaworth1,
				N.molRepCyclohexaneHaworth1,
				N.molRepCyclohexaneChair1,
				N.molRepCyclohexaneChair2
			]
		},
		{
			"name": N.molCharge,
			"attached": [
				N.molChargeClear,
				N.molChargePositive,
				N.molChargeNegative,
				N.molRadicalSinglet,
				N.molRadicalTriplet,
				N.molRadicalDoublet,
				N.molElectronLonePair
			]
		},
		{
			"name": N.glyph,
			"attached": [
				N.glyphReactionArrowNormal,
				N.glyphReactionArrowReversible,
				N.glyphReactionArrowResonance,
				N.glyphReactionArrowRetrosynthesis,
				N.glyphRepSegment,
				N.glyphElectronPushingArrowDouble,
				N.glyphElectronPushingArrowSingle,
				N.glyphRepHeatSymbol,
				N.glyphRepAddSymbol
			]
		},
		{
			"name": N.textImage,
			"attached": [
				N.textBlock,
				N.imageBlock
			]
		}
	]);

	// Object modifiers
	composer.setAllowedObjModifierCategories([C.GENERAL, C.CHEM_STRUCTURE, C.GLYPH, C.STYLE, C.MISC]);
};

/* copied from WellplateEditor */
function KekuleEditor_uploadBlob(blob, fileName, text, comment, debug = false, fileLabel = "") {
	let file = new File([blob], fileName, {
		type: blob.type,
		lastModified: new Date().getTime()
	});
	let container = new DataTransfer();
	container.items.add(file);
	fileInput = $('<input/>').attr('type', 'file');
	fileInput.files = container.files;
	var param = {
		filename: fileName,
		comment: comment,
		text: text,
		format: 'json',
		ignorewarnings: 1
	};
	var api = new mw.Api();
	api.upload(blob, param).done(function (data) {
		if (debug) console.log(data.upload.filename + ' has sucessfully uploaded.');
		file_exists = true;
		mw.hook('kekuleeditor.file.uploaded').fire({ exists: false, name: fileName, label: fileLabel });
		mw.notify('Saved', {
			type: 'success'
		});
		return { result: 'success', msg: 'Saved' };
	}).fail(function (data) {
		if (debug) console.log(data);
		if (data === 'exists' || data === 'was-deleted' || data === 'duplicate' || data == 'duplicate-archive' || data === 'page-exists') { //only warning, upload was successful anyway
			mw.hook('kekuleeditor.file.uploaded').fire({ exists: true, name: fileName, label: fileLabel});
			mw.notify('Saved', {
				type: 'success'
			});
			return { result: 'success', msg: 'Saved' };
		}
		// data === 'mustbeloggedin'
		else {
			mw.notify('An error occured while saving. \nPlease save your work on the local disk.', {
				title: 'Error',
				type: 'error'
			});
			return { result: 'error', msg: 'An error occured while saving. \nPlease save your work on the local disk.' };
		}
	});
}
