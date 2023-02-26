<?php

if ( function_exists( 'wfLoadExtension' ) ) {
	wfLoadExtension( 'ChemEditor' );
	// Keep i18n globals so mergeMessageFileList.php doesn't break
	$wgMessagesDirs['ChemEditor'] = __DIR__ . '/i18n';
	$wgExtensionMessagesFiles['ChemEditorAlias'] = __DIR__ . '/ChemEditor.i18n.alias.php';
	$wgExtensionMessagesFiles['ChemEditorMagic'] = __DIR__ . '/ChemEditor.i18n.magic.php';
	wfWarn(
		'Deprecated PHP entry point used for ChemEditor extension. Please use wfLoadExtension ' .
		'instead, see https://www.mediawiki.org/wiki/Extension_registration for more details.'
	);
	return true;
} else {
	die( 'This version of the ChemEditor extension requires MediaWiki 1.25+' );
}
