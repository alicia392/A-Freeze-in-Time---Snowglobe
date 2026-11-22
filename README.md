# A-Freeze-in-Time---Snowglobe

It's a virtual photobooth for anyone who want to preserve their memories.

**live demo:** https://alicia392.github.io/A-Freeze-in-Time---Snowglobe/
**built by:** Alicia @alicia392, Sophel @sopheldalulu

![alt text](<Image 11-22-26 at 2.19 PM.png>)

## how do you use it?

You click on the demo link to open the website, then you choose your frame, and finally you take your photos.

## how we built it

We used css to format the website, javascript to access the camera, and html to bring it all together.

## run it yourself

1. click the demo link

## what was hard, and how we fixed it

One challenge we faced was getting the gallery to connect properly to the Photo Booth. At first, the photos we took weren't showing up in the gallery. We fixed this by updating the JavaScript so that each finished photo was saved to the browser's local storage using IndexedDB. We also made sure the photo was fully saved before the user could open the gallery. After making these changes, the gallery could display the saved photos in an animated carousel.

## what's next

The next step is to add filters and to add more frame options.
