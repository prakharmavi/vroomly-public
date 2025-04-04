"use client";

import { FaFacebook, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";


export function Footer() {
    return (
        <footer className="bg-background border-t">
            <div className="container px-4 py-10 mx-auto">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 md:grid-cols-2">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Vroomly</h3>
                        <p className="text-muted-foreground mb-4">
                            Making carpooling simple, sustainable, and social.
                        </p>
                        <div className="flex space-x-4">
                            <Button variant="ghost" size="icon" aria-label="Facebook">
                                <FaFacebook className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Twitter">
                                <FaTwitter className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Instagram">
                                <FaInstagram className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="GitHub">
                                <FaGithub className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Links</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Home</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Licenses</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
                        <p className="text-muted-foreground mb-4">
                            Subscribe to our newsletter for updates.
                        </p>
                        <div className="flex space-x-2">
                            <Input type="email" placeholder="Your email" className="max-w-[220px]" />
                            <Button>Subscribe</Button>
                        </div>
                    </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Vroomly. All rights reserved.
                    </p>
                    <div className="mt-4 md:mt-0">
                        <p className="text-sm text-muted-foreground">
                            Made with ❤️ for a greener planet
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;