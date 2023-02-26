<?php
/**
 * Hooks for ChemEditor extension
 *
 * @file
 * @ingroup Extensions
 */

class ChemEditorHooks {

	public static function onParserFirstCallInit( Parser &$parser ) {
		$parser->setFunctionHook( 'chemeditor', [ self::class, 'chemeditor' ] );
	}

	public static function chemeditor( Parser &$parser )
	{
		// Called in MW text like this: {{#chemeditor: }}

		// For named parameters like {{#something: foo=bar | apple=orange | banana }}
		// See: https://www.mediawiki.org/wiki/Manual:Parser_functions#Named_parameters

		return "This text will be shown when calling this in MW text.";
	}

	public static function onBeforePageDisplay( $out ) {

		$out->addModules( 'ext.ChemEditor' );

		return true;

	}
}
