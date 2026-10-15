"use client";

import { useLayoutEffect } from "react";

import { applyBootState } from "./colorScheme";

/**
 * A locale switch remounts the root layout, and React clears the attributes of `<html>` when it
 * does: `data-theme`, and `js-enabled` with the `className` React owns. The boot script only
 * runs on a full page load, so this puts both back before the browser paints.
 */
export function ThemeSync() {
	useLayoutEffect(() => {
		applyBootState();
	}, []);
	return null;
}
