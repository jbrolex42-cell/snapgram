import React from "react";
import Svg, { Path } from "react-native-svg";

export default function VerifiedBadge({
size = 17,
style,
}) {
return ( <Svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   style={style}
 >
    <Path
     fill="#0095F6"
     d="
       M12 2.2
       C13.3 2.2 14 3.5 15.2 3.9
       C16.4 4.3 17.8 3.8 18.7 4.7
       C19.6 5.6 19.1 7 19.6 8.1
       C20.1 9.2 21.4 10 21.4 12
       C21.4 14 20.1 14.8 19.6 15.9
       C19.1 17 19.6 18.4 18.7 19.3
       C17.8 20.2 16.4 19.7 15.2 20.1
       C14 20.5 13.3 21.8 12 21.8
       C10.7 21.8 10 20.5 8.8 20.1
       C7.6 19.7 6.2 20.2 5.3 19.3
       C4.4 18.4 4.9 17 4.4 15.9
       C3.9 14.8 2.6 14 2.6 12
       C2.6 10 3.9 9.2 4.4 8.1
       C4.9 7 4.4 5.6 5.3 4.7
       C6.2 3.8 7.6 4.3 8.8 3.9
       C10 3.5 10.7 2.2 12 2.2
       Z
     "
   />
   
  <Path
    d="M8 12.2L10.5 14.7L16.2 9"
    stroke="#FFFFFF"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
</Svg>
);
}
