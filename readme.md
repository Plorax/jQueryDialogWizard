## Dialog Wizard

3 step example
https://jacquesmostert.com/github/jQueryDialogWizard/examples/3step.html

Similar to any setup wizard you've had to run to install software on your desktop.

See the examples in the example folder. If you don't find an example there you'd like to see, let me know and I'll add it.



Known issues:
1. More features have been added but they lack examples. I will improve on this.
2. Bugs related to 3rd party components such as Select2 where the DropDown does not actually show in the dialog window
   but not directly related to the dialog window, this can easily be resolved by CSS, as well as the overlay not showing
   under the dialog in some cases, although it some cases this might be desired. CSS to follow to bring back the overlay
   and also the Select2-container dropdown fix.
   
<style>
.ui-widget-overlay {
  opacity: 0.3;
}

.select2-container {
  z-index: 9999;
}
</style>

Cheers,
Developer.

Jacques Mostert
jacquesmostert@gmail.com
