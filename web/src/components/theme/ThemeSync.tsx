"use client";

import { useLayoutEffect } from "react";

import { applyColorScheme, readStoredColorScheme } from "./colorScheme";

/**
 * A locale switch remounts the root layout, and React clears the attributes of `<html>` when it
 * does; the inline theme script only runs on a full page load. This puts the stored scheme back
 * before the browser paints.
 */
export function ThemeSync() {
	useLayoutEffect(() => {
		applyColorScheme(readStoredColorScheme());
	}, []);
	return null;
}
