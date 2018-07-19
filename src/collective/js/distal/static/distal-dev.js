/** Copyright 2012 mocking@gmail.com

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

function distal(root, obj) {
  "use strict";
  //create a duplicate object which we can add properties to without affecting the original
  let wrapper = function() {};
  wrapper.prototype = obj;
  obj = new wrapper();

  let resolve = distal.resolve,
    node = root,
    doc = root.ownerDocument,
    undefined = {}.undefined,

    //TAL attributes for querySelectorAll call
    qdef = "data-qdef",
    qif = "data-qif",
    qrepeat = "data-qrepeat",
    qattr = "data-qattr",
    qtext = "data-qtext",
    qdup = "data-qdup",

    //attributes which don't support setAttribute()
    altAttr = {
      className:1, "class":1, /*innerHTML:1,*/ innerText:1, style:1, src:1, href:1, id:1, 
      value:1, checked:1, selected:1, label:1, htmlFor:1, text:1, title:1, disabled:1
    }
    ,formInputHasBody = {BUTTON:1, LABEL:1, LEGEND:1, FIELDSET:1, OPTION:1};


  //output formatter
  let format = distal.format;

  let TAL = "*[" + [qdef, qif, qrepeat, qattr/*, qtext*/].join("],*[") + "]";

  let getProp = function(s) {return this[s]};

  //there may be generated node that are siblings to the root node if the root node 
  //itself was a repeater. Remove them so we don't have to deal with them later
  let tmpNode = root.parentNode;
  while((node = root.nextSibling) && (node.qdup || (node.nodeType === 1 && node.hasAttribute(qdup)))) {
    tmpNode.removeChild(node);
  }

  //if we generate repeat nodes and are dealing with non-live NodeLists, then
  //we add them to the listStack[] and process them first as they won't appear inline
  //due to non-live NodeLists when we traverse our tree

  //get a list of concerned nodes within this root node.
  
  //remove all generated nodes (repeats), so we don't have to deal with them later.
  //Only need to do this for non-live NodeLists.
  {
    let nodes = root.querySelectorAll("*[" + qdup + "]");
    for(let n of nodes) n.parentNode.removeChild(n);
  }

  let listStack = [root.querySelectorAll(TAL)];
  let posStack = [0];
  let list = [root];
  let pos = 0;

  while(true) {
    node = list[pos++];

    //when finished with the current list, there are generated nodes and
    //their children that need to be processed.
    while(!node && (list = listStack.pop())) {
      pos = posStack.pop();
      node = list[pos++];
    }

    if(!node) break;
    let attr;

    //creates a shortcut to an object
    //e.g., <section qdef="feeds main.sidebar.feeds; user main.accounts.user">
    attr = node.getAttribute(qdef);
    if(attr) {
      let multi = attr.split(/;\s*/);
      for(let each of multi) {
        let [name, value, index] = each.split(" ");
        //add it to the object as a property
        value = resolve(obj, value);

        //the 3rd parameter if exists is a numerical index into the array
        if(index) {
          obj["#"] = parseInt(index) + 1;
          value = value[index];
        }

        obj[name] = value;
      }
    }

    //shown if object is truthy
    //e.g., <img qif="item.unread or item.header"> <img qif="item.count gt 1">

    attr = node.getAttribute(qif);
    if(attr) {
      let value;
      let list = attr.split(" or ");

      for(let each of list) {
        let list = each.split(" and ");

        for(let each of list) {
          let [name, op, compare] = each.split(" ", 3);
          if(name.indexOf("not:") === 0) {
            name = name.substr(4);
            op = "not";
            compare = 0;
          }

          value = resolve(obj, name);

          //if obj is empty array it is still truthy, so make it the array length
          if(value && value.join && value.length > -1) value = value.length;

          if(op) {
            if(typeof value === "number") compare *= 1;

            switch(op) {
              case "not": value = !value; break;
              case "eq": value = (value == compare); break;
              case "ne": value = (value != compare); break;
              case "gt": value = (value > compare); break;
              case "lt": value = (value < compare); break;
              case "cn": value = (value && value.indexOf(compare) >= 0); break;
              case "nc": value = (value && value.indexOf(compare) < 0); break;
              default: throw node;
            }
          }
          if(!value) break;
        }
        if(value) break;
      }

      if(value) {
        node.style.display = "";
      } else {
        node.style.display = "none";

        //skip over all nodes that are children of this node
        pos += node.querySelectorAll(TAL).length;

        //stop processing the rest of this node as it is invisible
        continue;
      }
    }

    //duplicate the current node x number of times where x is the length
    //of the resolved array. Create a shortcut variable for each iteration
    //of the loop.
    //e.g., <div qrepeat="item feeds.items">

    attr = node.getAttribute(qrepeat);
    if(attr) {
      let [name, value] = attr.split(" ");

      if(!value) throw node;
      let objList = resolve(obj, value);

      if(objList && objList.length) {
        node.style.display = "";
        //allow this node to be treated as index zero in the repeat list
        //we do this by setting the shortcut variable to array[0]
        obj[name] = objList[0];
        obj["#"] = 1;

      } else {
        //we need to hide the repeat node if the object doesn't resolve
        node.style.display = "none";
        //skip over all nodes that are children of this node
        pos += node.querySelectorAll(TAL).length;

        //stop processing the rest of this node as it is invisible
        continue;
      }

      if(objList.length > 1) {  //we need to duplicate this node x number of times

        //push the current list and index to the stack and process the repeated
        //nodes first. We need to do this inline because some variable may change 
        //value later, if they become redefined.
        listStack.push(list);
        posStack.push(pos);
        //clear the current list so that in the next round we grab another list
        //off the stack
        list = [];

        //add this node to the stack so that it is processed right before we pop the
        //main list off the stack. This will be the last node to be processed and we 
        //use it to assign our repeat variable to array index 0 so that the node's
        //children, which are also at array index 0, will be processed correctly
        let fakeNode = {getAttribute: getProp};
        fakeNode[qdef] = attr + " 0";
        listStack.push([fakeNode]);
        posStack.push(0);
      
        let clone = node.cloneNode(true);
        if("form" in clone) clone.checked = false;
        clone.setAttribute(qdup, "1");

        let newAttr = node.getAttribute(qdef) || "";
        if(newAttr) newAttr += "; ";
        newAttr += node.getAttribute(qrepeat) + " ";

        clone.removeAttribute(qrepeat);

        let parent = node.parentNode;
        let sibling = node.nextSibling;
        let frag = doc.createDocumentFragment();

        for(let i = 1; i < objList.length; i++) {
          let node = frag.appendChild(clone.cloneNode(true));
          node.setAttribute(qdef, newAttr + i);
          
          //we need to add the repeated nodes to the listStack because 
          //we are either (1) dealing with a live NodeList and we are still at
          //the root node so the newly created nodes are adjacent to the root
          //and so won't appear in the NodeList, or (2) we are dealing with a
          //non-live NodeList, so we need to add them to the listStack
          listStack.push(node.querySelectorAll(TAL));
          posStack.push(0);

          listStack.push([node]);
          posStack.push(0);

          node.qdup = 1;
        }
        parent.insertBefore(frag, sibling);

        //in case it is a select element
        parent.selectedIndex = -1;
      }
    }

    //set multiple attributes on the node
    //e.g., <div qattr="value item.text; disabled item.disabled">

    attr = node.getAttribute(qattr);
    if(attr) {
      let name;
      let value;
      let list = attr.split(/;\s*/);
      for(let each of list) {
        let [name, value, fmt] = each.split(" ", 3);
        if(!value) throw node;
        
        value = resolve(obj, value);
        if(value === undefined) value = "";

        if(fmt) fmt = format[fmt];
        if(fmt) value = fmt(value);

        if(altAttr[name]) {
          switch(name) {
            case "disabled":
            case "checked":
            case "selected": node[name] = !!value; break;
            case "style": node.style.cssText = value; break;
            case "innerText":
            case "text": node.textContent = value; break;  //e.g. <option value=value>text</option>
            case "class": 
            case "className":
              if(!node.hasAttribute("data-qclass0")) {
                node.setAttribute("data-qclass0", node.className);
              } else {
                node.className = node.getAttribute("data-qclass0");
              }
              if(value) node.classList.add(value);
              break;
            default: node[name] = value;
          }
        } else {
          node.setAttribute(name, value);
        }
      }
    }

    //sets the innerText on the node
    //e.g., <div qtext="item.description">

    attr = node.getAttribute(qtext);
    if(attr) {
      let [value, fmt] = attr.split(" ");

      value = resolve(obj, value);
      if(value === undefined) value = "";

      if(fmt) fmt = format[fmt];
      if(fmt) value = fmt(value);

      node["form" in node && !formInputHasBody[node.tagName] ? "value" : "textContent"] = value;
    }
  }  //end while
}

//follows the dot notation path to find an object within an object: obj["a"]["b"]["1"] = c;
distal.resolve = function(obj, seq) {
  //if fully qualified path is at top level: obj["a.b.d"] = c
  let lastObj, x = obj[seq];
  if(x) return (typeof x === "function") ? x.call(obj, seq) : x;

  seq = seq.split(".");
  x = 0;
  while(seq[x] && (lastObj = obj)) {
    if(seq[x] === "@last" && obj instanceof Array) {
      //we support a special property "array.@last" for accessing the last item in the array
      obj = obj[obj.length - 1];
      x++;
    } else {
      obj = obj[seq[x++]];
    }
  }
  return (typeof obj === "function") ? obj.call(lastObj, seq.join(".")) : obj;
};

//number formatters
distal.format = {
  ",.": function(value) {
    let i = value*1;
    return isNaN(i) ? value : (i % 1 ? i.toFixed(2) : i + "").replace(/(^\d{1,3}|\d{3})(?=(?:\d{3})+(?:$|\.))/g, "$1,");
  }
};
