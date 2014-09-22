********************
collective.js.distal
********************

.. contents:: Table of Contents

Life, the Universe, and Everything
==================================

`Distal`_ is a Javascript tool that automatically fills your webpage with data from a JSON source.
Freeing you from needing to traverse nodes or create DOM trees just to add dynamic data.
Allowing you to focus on the important things such as data logic and webpage design. 

Distal uses a concept created by `Zope`_ used in Python projects called Template Attribute Language (`TAL`_).

.. _`Distal`: https://code.google.com/p/distal/
.. _`Zope`: http://www.zope.org/
.. _`TAL`: http://wiki.zope.org/ZPT/TAL

Mostly Harmless
===============

.. image:: https://secure.travis-ci.org/collective/collective.js.distal.png?branch=master
    :alt: Travis CI badge
    :target: http://travis-ci.org/collective/collective.js.distal

.. image:: https://coveralls.io/repos/collective/collective.js.distal/badge.png?branch=master
    :alt: Coveralls badge
    :target: https://coveralls.io/r/collective/collective.js.distal

.. image:: https://pypip.in/d/collective.js.distal/badge.png
    :alt: Downloads
    :target: https://pypi.python.org/pypi/collective.js.distal/

Don't Panic
===========

Installation
------------

To enable this package in a buildout-based installation:

#. Edit your buildout.cfg and add add the following to it::

    [buildout]
    ...
    eggs =
        collective.js.distal

After updating the configuration you need to run ''bin/buildout'', which will take care of updating your system.

Go to the 'Site Setup' page in a Plone site and click on the 'Add-ons' link.

Check the box next to ``collective.js.distal`` and click the 'Activate' button.

.. Note::

    You may have to empty your browser cache and save your resource registries in order to see the effects of the product installation.

Not entirely unlike
===================

`jstal`_
    TAL implementation in JavaScript using E4X.

`template-tal`_
    XML Lightweight Template Attribute Language implementation for Javascript.

.. _`jstal`: https://code.google.com/p/jstal/
.. _`template-tal`: https://www.npmjs.org/package/template-tal
